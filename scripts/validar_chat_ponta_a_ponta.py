"""Valida o chat ponta a ponta na MESMA ordem do front (src/services/backend.ts), pelo proxy do Vite.

    definir/ -> conversas/sessao/?sessao_id= -> i-agora/perfil/ -> i-agora/sessao/abertura/
             -> conversas/mensagens/ (uma por pergunta) -> i-agora/plano/

Uso (Git Bash ou PowerShell, com o backend Django em :8000 e o Vite em :3000):

    python scripts/validar_chat_ponta_a_ponta.py
    python scripts/validar_chat_ponta_a_ponta.py --pergunta "O que eu faço com as sobras?" --saida evidencia.json
    python scripts/validar_chat_ponta_a_ponta.py --base http://127.0.0.1:3000 --usuario <id_usuario UUID>

Por que Python e não curl: no Git Bash, acentos passados ao curl na linha de comando chegam ao Django
fora de UTF-8 e dão 400. Aqui o corpo é sempre json.dumps(...).encode('utf-8').

Um 503 do chat é classificado lendo GET conversas/status/ (ultimas_chamadas):
  - PROVEDOR:       alguma chamada recente com outcome 'failed_or_uncertain' (Gemini falhou, 429, timeout);
  - DETERMINISTICO: todas as chamadas recentes 'complete' -> quem recusou foi um guard/validação do backend;
  - NAO_MEDIDO:     status/ indisponível ou sem chamadas registadas.
As métricas de status/ são do processo inteiro (não por pedido): a classificação é indício, não prova.

Saída: 0 = todas as etapas com o código esperado e chat 200; 1 = alguma etapa falhou; 2 = chat 503 (classificado).
"""
from __future__ import annotations

import argparse
import http.cookiejar
import json
import re
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone

UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
PADRAO_USUARIO = "00108ccd-699c-453a-a9f9-a66aad6e03e5"  # Maria, linha 1 de backend/data/usuarios_verdade.csv
BRT = timezone(timedelta(hours=-3))


class Cliente:
    def __init__(self, base: str, timeout: float):
        self.base = base.rstrip("/") + "/api/v1/context-agent/"
        self.origin = base.rstrip("/")
        self.timeout = timeout
        self.jar = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
        self.sessao_id: str | None = None

    def cookie(self, nome: str) -> str | None:
        return next((c.value for c in self.jar if c.name == nome), None)

    def chamar(self, caminho: str, metodo: str = "GET", corpo=None):
        h = {"Content-Type": "application/json", "Origin": self.origin}
        if self.cookie("csrftoken"):
            h["X-CSRFToken"] = self.cookie("csrftoken")
        if self.sessao_id:
            h["X-Sessao-Id"] = self.sessao_id  # o front manda em TODO pedido depois de definir/
        dados = None if corpo is None else json.dumps(corpo, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(self.base + caminho, method=metodo, headers=h, data=dados)
        t = time.monotonic()
        try:
            r = self.op.open(req, timeout=self.timeout)
            codigo, bruto = r.status, r.read()
        except urllib.error.HTTPError as e:
            codigo, bruto = e.code, e.read()
        except (urllib.error.URLError, TimeoutError) as e:
            return None, {"erro_rede": str(e)}, round((time.monotonic() - t) * 1000)
        try:
            corpo_resp = json.loads(bruto or b"{}")
        except json.JSONDecodeError:
            corpo_resp = {"nao_json": bruto[:200].decode("utf-8", "replace")}
        return codigo, corpo_resp, round((time.monotonic() - t) * 1000)


def classificar_503(cli: Cliente) -> dict:
    codigo, st, _ = cli.chamar("conversas/status/")
    if codigo != 200:
        return {"classe": "NAO_MEDIDO", "motivo": f"conversas/status/ respondeu {codigo}"}
    chamadas = (st.get("ultimas_chamadas") or [])[-3:]
    if not chamadas:
        return {"classe": "NAO_MEDIDO", "motivo": "status/ sem ultimas_chamadas"}
    falhas = [c for c in chamadas if c.get("outcome") != "complete"]
    resumo = [{k: c.get(k) for k in ("stage", "model", "latency_ms", "outcome", "tratamento_erro")} for c in chamadas]
    if falhas:
        return {"classe": "PROVEDOR", "ultimas_chamadas": resumo}
    return {"classe": "DETERMINISTICO", "ultimas_chamadas": resumo}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base", default="http://127.0.0.1:3000", help="origem do front (proxy do Vite)")
    ap.add_argument("--usuario", default=PADRAO_USUARIO, help="id_usuario UUID (índice posicional dá 400)")
    ap.add_argument("--pergunta", action="append", help="repita para várias; padrão: 'O que eu faço com as sobras?'")
    ap.add_argument("--timeout", type=float, default=120.0)
    ap.add_argument("--saida", help="grava a evidência em JSON (não versionar se tiver dados de sessão)")
    a = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # console Windows em cp1252
    if not UUID.fullmatch(a.usuario.lower()):
        print(f"RECUSADO: --usuario precisa ser UUID, veio {a.usuario!r} (o backend devolve 400 a índices)")
        return 1

    cli = Cliente(a.base, a.timeout)
    etapas, falhou, chat_503 = [], False, False

    def etapa(nome, esperado, codigo, corpo, ms, extra=""):
        nonlocal falhou
        ok = codigo in esperado
        falhou |= not ok
        etapas.append({"etapa": nome, "http": codigo, "ms": ms, "ok": ok})
        print(f"{'ok   ' if ok else 'FALHA'} {nome:<10} {codigo} {ms} ms {extra}")
        if not ok:
            print("      ", json.dumps(corpo, ensure_ascii=False)[:300])

    c, d, ms = cli.chamar("perfil-usuario/definir/", "POST", {"usuario": a.usuario})
    etapa("definir", {201}, c, d, ms, (d.get("usuario") or {}).get("pessoa", ""))
    cli.sessao_id = d.get("sessao_id")
    if not cli.sessao_id:
        print("Sem sessao_id: backend sem definir/ (agent_backend?) ou fora do ar. Um só backend na :8000.")
        return 1
    sid, cli.sessao_id = cli.sessao_id, None
    c, d, ms = cli.chamar(f"conversas/sessao/?sessao_id={sid}")
    cli.sessao_id = sid
    etapa("sessao", {200}, c, d, ms, f"mode={d.get('mode')} csrftoken={'sim' if cli.cookie('csrftoken') else 'NAO'}")
    c, d, ms = cli.chamar("i-agora/perfil/")
    etapa("perfil", {200}, c, d, ms, "(404 = front entra em modo só-chat)" if c == 404 else "")
    c, d, ms = cli.chamar("i-agora/sessao/abertura/", "POST", {"origem": "fab", "next": False})
    etapa("abertura", {200, 201}, c, d, ms, ((d.get("state") or {}).get("opening") or {}).get("message", "")[:100])

    cid = None
    for q in a.pergunta or ["O que eu faço com as sobras?"]:
        corpo = {"schema_version": "1.0", "conversation_id": cid, "client_message_id": str(uuid.uuid4()), "message": q}
        c, d, ms = cli.chamar("conversas/mensagens/", "POST", corpo)
        cid = d.get("conversation_id") or cid
        extra = f"status={d.get('status')} dados={(d.get('dados') or {}).get('estado')}"
        if c == 503:
            chat_503 = True
            cls = classificar_503(cli)
            etapas.append({"etapa": "classificacao_503", **cls})
            extra += f" -> 503 {cls['classe']}"
        etapa("mensagens", {200}, c, d, ms, extra)
        print(f"       > {q}\n       < {(d.get('reply') or '')[:400]}")

    c, d, ms = cli.chamar("i-agora/plano/")
    etapa("plano", {200, 404}, c, d, ms)

    if a.saida:
        with open(a.saida, "w", encoding="utf-8") as f:
            json.dump({"medido_em": datetime.now(BRT).isoformat(timespec="seconds"), "base": a.base,
                       "usuario": a.usuario, "etapas": etapas}, f, ensure_ascii=False, indent=2)
        print("evidência:", a.saida)
    return 2 if chat_503 else 1 if falhou else 0


if __name__ == "__main__":
    sys.exit(main())

# Relato de uma validação ponta a ponta

Uma linha por etapa, sempre com selo (valor · fonte · hora BRT):

    E2E pela :3000 · scripts/validar_chat_ponta_a_ponta.py · <HH:MM> BRT · usuario <UUID>
    definir <http> / sessao <http> / perfil <http> / abertura <http> / mensagens <http> <status> / plano <http>
    503: <PROVEDOR | DETERMINISTICO | NAO_MEDIDO> — <stage/model/outcome das ultimas_chamadas>
    gate: <saída de node skills/integracao-front-back/tools/gate.mjs --evidencia <arquivo>>

Etapa que não rodou é `NAO_MEDIDO`, nunca omitida. Não cole `sessao_id` nem cookies no relato.

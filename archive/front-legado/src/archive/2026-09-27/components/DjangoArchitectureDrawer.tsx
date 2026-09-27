import React, { useState } from 'react';
import { Customer } from '../types';
import {
  X,
  FolderTree,
  Terminal,
  Play,
  Copy,
  Check,
  Send,
  Loader2,
  Clock,
  ShieldCheck,
  MessageSquare,
  Network,
} from 'lucide-react';

interface DjangoArchitectureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentCustomer: Customer;
}

export const DjangoArchitectureDrawer: React.FC<DjangoArchitectureDrawerProps> = ({
  isOpen,
  onClose,
  currentCustomer,
}) => {
  const DATA_CORTE_FIXA = "2025-12-22";
  const horaCalculada = ((currentCustomer.id * 7 + 9) % 24).toString().padStart(2, '0');
  const minutoCalculado = ((currentCustomer.id * 13 + 15) % 60).toString().padStart(2, '0');
  const segundoCalculado = ((currentCustomer.id * 19 + 25) % 60).toString().padStart(2, '0');
  const horarioCasado = `${horaCalculada}:${minutoCalculado}:${segundoCalculado}`;

  const [selectedFile, setSelectedFile] = useState<string>('services/primeira_chamada.py');
  const [apiEndpoint, setApiEndpoint] = useState<string>('rotas-yaml');
  const [copied, setCopied] = useState<boolean>(false);

  const [userPrompt, setUserPrompt] = useState<string>(
    'Olá Especialista Itaú! Com base no meu momento, quais as recomendações para hoje?'
  );
  const [agentResponse, setAgentResponse] = useState<string>('A resposta do modelo aparecerá aqui.');
  const [isLoadingAgent, setIsLoadingAgent] = useState<boolean>(false);
  const [agentError, setAgentError] = useState<string>('');
  const [modeloUsado, setModeloUsado] = useState<string>('');
  const [tempoBackendMs, setTempoBackendMs] = useState<number | null>(null);
  const [tempoNavegadorMs, setTempoNavegadorMs] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSendMessage = async () => {
    if (!userPrompt.trim()) return;
    setIsLoadingAgent(true);
    setAgentError('');
    setModeloUsado('');
    setTempoBackendMs(null);
    setTempoNavegadorMs(null);
    const inicio = performance.now();
    try {
      const response = await fetch('/api/v1/context-agent/primeira-chamada/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto_inicial: userPrompt.trim() }),
      });
      const data = await response.json();
      setTempoBackendMs(typeof data.tempo_resposta_ms === 'number' ? data.tempo_resposta_ms : null);
      if (!response.ok || !data.sucesso) throw new Error(data.erro || 'Falha na chamada ao modelo.');
      setAgentResponse(data.resposta);
      setModeloUsado(data.modelo);
    } catch (error) {
      setAgentError(error instanceof Error ? error.message : 'Não foi possível chamar o modelo.');
      setAgentResponse('');
    } finally {
      setTempoNavegadorMs(Math.round((performance.now() - inicio) * 100) / 100);
      setIsLoadingAgent(false);
      setApiEndpoint('primeira-chamada');
    }
  };

  const fileContents: Record<string, { lang: string; path: string; code: string }> = {
    'services/primeira_chamada.py': {
      lang: 'python',
      path: 'desafio-itau-batalha-de-agentes-time2/apps/context_agent_datadriven/services/primeira_chamada.py',
      code: `POST /api/v1/context-agent/primeira-chamada/
Corpo enviado pelo navegador: {"texto_inicial": "..."}
Corpo enviado ao Gemini: {"contents": [{"role": "user", "parts": [{"text": "..."}]}]}
Chave: API_KEY_SECRECT somente no servidor Django.
Modelo: gemini-3.5-flash-lite.
Resposta: texto do modelo ou erro explícito; tempo_resposta_ms medido no Django.`,
    },
    'models.py (Aponta para Rotas)': {
      lang: 'python',
      path: 'desafio-itau-batalha-de-agentes-time2/apps/context_agent_datadriven/models.py',
      code: `"""
Models: Aponta diretamente para a base de 'rotas' (rotas_base.yaml)
e delega para 'agentes/agente.py' a distribuição pelo protocolo de negociação.
"""
from django.db import models
from .rotas.manager import BaseDeRotasManager
from .agentes.agente import AgenteNegotiatorEngine

class ConversaAgenteSessao(models.Model):
    cliente_id = models.IntegerField(default=42)
    cliente_nome = models.CharField(max_length=150)
    data_corte_fixa = models.CharField(max_length=20, default="2025-12-22")
    horario_casado = models.CharField(max_length=20)

    def despachar_chamada_harness(self, mensagem_usuario: str, contexto_interno: dict) -> dict:
        # 1. Models aponta para a base de rotas
        rota_info = BaseDeRotasManager.identificar_categoria(mensagem_usuario, self.score_comportamental)

        # 2. Delega para agentes/agente.py a distribuição via protocolo de negociação
        return AgenteNegotiatorEngine.distribuir_chamada(
            mensagem_usuario=mensagem_usuario,
            cliente_id=self.cliente_id,
            contexto_interno=contexto_interno,
        )`,
    },
    'rotas/templates/rotas_base.yaml': {
      lang: 'yaml',
      path: 'desafio-itau-batalha-de-agentes-time2/apps/context_agent_datadriven/rotas/templates/rotas_base.yaml',
      code: `# BASE DE ROTAS - TEMPLATE YAML COM INFORMAÇÕES DE CADA CATEGORIA
versao_schema: "2.4.0-datadriven"
data_corte_fixa: "2025-12-22"
janela_temporal_horario: "24h"
protocolo_negociacao_padrao: "consenso_prioritario_com_fallback"

categorias:
  investimentos_e_patrimonio:
    id: "CAT-INV-01"
    nome: "Investimentos & Alocação de Patrimônio"
    score_minimo: 650
    protocolo_negociacao:
      provedor_primario: "google"
      modelo_primario: "gemini-flash-latest"
      provedores_alternativos: ["antropic", "openIa"]
      sla_latencia_max_ms: 1200
    diretriz_template:
      foco: "CDB progressivo 112% CDI, alocação segura, liquidez seletiva."

  credito_e_limites:
    id: "CAT-CRED-02"
    nome: "Crédito Consciente e Limites"
    score_minimo: 450
    protocolo_negociacao:
      provedor_primario: "google"
      modelo_primario: "gemini-flash-latest"
      provedores_alternativos: ["antropic", "openIa"]

  seguranca_e_reserva_emergencia:
    id: "CAT-RES-03"
    nome: "Reserva de Emergência e Proteção"
    score_minimo: 0
    protocolo_negociacao:
      provedor_primario: "google"
      modelo_primario: "gemini-3.5-flash-lite"

  atendimento_consultivo_geral:
    id: "CAT-GERAL-04"
    nome: "Atendimento Consultivo Geral"
    score_minimo: 0
    protocolo_negociacao:
      provedor_primario: "google"
      modelo_primario: "gemini-flash-latest"`,
    },
    'agentes/agente.py': {
      lang: 'python',
      path: 'desafio-itau-batalha-de-agentes-time2/apps/context_agent_datadriven/agentes/agente.py',
      code: `"""
Agente: Faz a distribuição das chamadas conforme as rotas mapeadas como protocolo de negociação.
"""
from ..rotas.manager import BaseDeRotasManager
from .LLM_Models import PROVEDORES_REGISTRADOS
from ..pastas_raiz.controles_evals.evals_google_agent import executar_eval_harness

class AgenteNegotiatorEngine:
    DATA_CORTE_FIXA = "2025-12-22"

    @classmethod
    def distribuir_chamada(cls, mensagem_usuario: str, cliente_id: int, contexto_interno: dict):
        # Mapeia rota do template YAML
        rota = BaseDeRotasManager.identificar_categoria(mensagem_usuario, contexto_interno.get("score"))
        cfg = rota["detalhes"]["protocolo_negociacao"]

        # Provedor da rota; falhando, tenta gemini-3.5-flash-lite
        provedor = PROVEDORES_REGISTRADOS[cfg["provedor_primario"]]
        resultado = provedor.executar_chamada(
            modelo=cfg["modelo_primario"],
            system_instruction=cls.montar_prompt_sigiloso(contexto_interno),
            contents=[{"role": "user", "parts": [{"text": mensagem_usuario}]}],
        )
        if resultado["sucesso"]:
            origem = ORIGEM_MODELO            # "modelo"
        else:
            # Ninguém respondeu: texto local ROTULADO, sem fingir provedor/modelo
            origem = ORIGEM_CONTINGENCIA      # "contingencia"
            provedor_executado = modelo_executado = None

        # Validação mecânica com evals da pasta_raiz
        eval_status = executar_eval_harness(resultado["resposta"], cls.calcular_horario_casado(cliente_id))
        return {
            "sucesso": origem == ORIGEM_MODELO,   # a view devolve 503 quando False
            "origem_resposta": origem,
            "resposta": resultado["resposta"],
            "categoria": rota["chave_categoria"],
            "protocolo": cfg,
            "eval": eval_status
        }`,
    },
    'agentes/LLM_Models/google': {
      lang: 'python',
      path: 'desafio-itau-batalha-de-agentes-time2/apps/context_agent_datadriven/agentes/LLM_Models/google/cliente.py',
      code: `class GoogleLLMCliente:
    PROVIDER_NAME = "google"
    MODELOS = ["gemini-flash-latest", "gemini-3.5-flash-lite"]

    @classmethod
    def get_secret(cls):
        # Secret do gsconsole da conta do próprio agente
        return os.environ.get("GSCONSOLE_SECRET") or os.environ.get("GEMINI_API_KEY")

    @classmethod
    def executar_chamada(cls, modelo, system_instruction, contents, ...):
        # Executa REST call com timeout e headers seguros
        ...`,
    },
    'agentes/LLM_Models/antropic': {
      lang: 'python',
      path: 'desafio-itau-batalha-de-agentes-time2/apps/context_agent_datadriven/agentes/LLM_Models/antropic/cliente.py',
      code: `class AntropicLLMCliente:
    PROVIDER_NAME = "antropic"
    MODELOS = ["claude-3-5-sonnet", "claude-3-haiku"]

    @classmethod
    def executar_chamada(cls, modelo, system_instruction, contents, ...):
        # Adaptador do protocolo de negociação em contingência
        return {"sucesso": True, "provider": "antropic", "modelo": modelo}`,
    },
    'agentes/LLM_Models/openIa': {
      lang: 'python',
      path: 'desafio-itau-batalha-de-agentes-time2/apps/context_agent_datadriven/agentes/LLM_Models/openIa/cliente.py',
      code: `class OpenIaLLMCliente:
    PROVIDER_NAME = "openIa"
    MODELOS = ["gpt-4o", "gpt-4o-mini"]

    @classmethod
    def executar_chamada(cls, modelo, system_instruction, contents, ...):
        # Adaptador do protocolo de negociação em contingência
        return {"sucesso": True, "provider": "openIa", "modelo": modelo}`,
    },
    'pastas_raiz/docs (Tese)': {
      lang: 'python',
      path: 'desafio-itau-batalha-de-agentes-time2/apps/context_agent_datadriven/pastas_raiz/docs/tese_agente_docs.py',
      code: `TESE_COMPLETA_CONTEXTUALIZADA = {
    "versao_tese": "2.4.0-datadriven",
    "data_corte": "2025-12-22",
    "fontes_de_evidencia": [
        "Extrato unificado de conta corrente e poupança",
        "Padrão de utilização de limite de crédito",
        "Histórico Pix e contas essenciais",
        "Recorte amostral determinístico de 1.000 clientes",
    ]
}`,
    },
    'pastas_raiz/controles_evals': {
      lang: 'python',
      path: 'desafio-itau-batalha-de-agentes-time2/apps/context_agent_datadriven/pastas_raiz/controles_evals/evals_google_agent.py',
      code: `EVAL_METRICAS_MERCADO = {
    "groundedness": {"benchmark_minimo": 0.94, "metodo": "Google Cloud Vertex AI GenAI Eval Metric"},
    "leak_prevention_score": {"benchmark_minimo": 0.99, "metodo": "Mechanical Harness Filter Check"},
    "temporal_alignment": {"benchmark_minimo": 1.00, "metodo": "Timestamp Assertion Harness"},
}`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContents[selectedFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLiveApiResponse = () => {
    if (apiEndpoint === 'rotas-yaml') {
      return {
        etapa: 'Primeira chamada',
        fluxo: 'Aba React → API Django → Gemini → resposta em texto',
        carga: 'Somente texto_inicial. Sem histórico ou dados do cliente.',
        instrucao: 'Digite o texto inicial e clique em Chamar Gemini.',
      };
    }
    return {
      etapa: agentError ? 'Erro' : modeloUsado ? 'Resposta recebida' : 'Aguardando envio',
      entrada: userPrompt.trim(),
      destino: modeloUsado || 'gemini-3.5-flash-lite',
      resposta: agentError || agentResponse,
      tempo_backend_ms: tempoBackendMs ?? 'NAO_MEDIDO',
      tempo_total_navegador_ms: tempoNavegadorMs ?? 'NAO_MEDIDO',
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-slate-900 text-slate-100 rounded-3xl w-full max-w-6xl h-[88vh] shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EC7000] text-white flex items-center justify-center font-bold text-sm">
              dj
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  App Django: <span className="text-orange-400">context-agent-datadriven</span>
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                  <Network className="w-3 h-3 text-emerald-400" />
                  Base de Rotas YAML & Protocolo de Negociação
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Texto inicial → Django → Google Gemini → resposta em texto
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            title="Fechar Inspetor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body 2 Columns */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Column */}
          <div className="w-full md:w-80 bg-slate-950 border-r border-slate-800 p-4 flex flex-col gap-3.5 shrink-0 overflow-y-auto">
            
            {/* Live Chat Interativo do Harness */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-orange-400" />
                Primeira chamada Google Gemini
              </span>

              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-400 font-sans resize-none"
                placeholder="Digite a mensagem para o agente..."
              />

              <button
                onClick={handleSendMessage}
                disabled={isLoadingAgent || !userPrompt.trim() || userPrompt.length > 2000}
                className="w-full py-1.5 px-3 bg-[#EC7000] hover:bg-[#d86300] active:scale-[0.98] text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all"
              >
                {isLoadingAgent ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Chamando Gemini...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Chamar Gemini</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-slate-400">Apenas o texto inicial é enviado ao modelo. Limite: 2000 caracteres.</p>
              {agentError && <p role="alert" className="text-xs text-red-400">{agentError}</p>}
            </div>

            {/* File Tree da Nova Arquitetura de Pastas */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1.5 font-bold flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-[#EC7000]" />
                Nova Arquitetura de Pastas
              </span>
              <div className="space-y-1 text-xs">
                {Object.keys(fileContents).map((fileKey) => (
                  <button
                    key={fileKey}
                    onClick={() => setSelectedFile(fileKey)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg font-mono transition-all flex items-center justify-between ${
                      selectedFile === fileKey
                        ? 'bg-[#001E62] text-white font-bold border border-blue-500/40'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{fileKey}</span>
                    <span className="text-[10px] text-slate-500">{fileContents[fileKey].lang}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live API Tester */}
            <div className="border-t border-slate-800 pt-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2 font-bold flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                Endpoints da Base de Rotas
              </span>

              <div className="space-y-1 text-xs">
                <button
                  onClick={() => setApiEndpoint('rotas-yaml')}
                  className={`w-full text-left p-1.5 rounded-lg text-[11px] font-mono transition-all ${
                    apiEndpoint === 'rotas-yaml'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-emerald-400 font-bold">GET</span> /api/v1/context-agent/status-harness/ (YAML)
                </button>

                <button
                  onClick={() => setApiEndpoint('primeira-chamada')}
                  className={`w-full text-left p-1.5 rounded-lg text-[11px] font-mono transition-all ${
                    apiEndpoint === 'primeira-chamada'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-orange-400 font-bold">POST</span> /api/v1/context-agent/primeira-chamada/
                </button>
              </div>
            </div>

            {/* Quick Summary do Contrato de Data Fixa */}
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[10px] font-bold">
                <Clock className="w-3 h-3" />
                <span>Data de corte para contexto + Time:</span>
              </div>
              <p className="font-bold text-white font-mono">{DATA_CORTE_FIXA} · {horarioCasado}</p>
              <p className="text-[10px] text-slate-400">Modelos: LLM_Models (google, antropic, openIa)</p>
            </div>

          </div>

          {/* Right Column: Code Viewer & Live Response */}
          <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
            
            {/* Code Toolbar */}
            <div className="px-5 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="truncate">{fileContents[selectedFile].path}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {/* Code Editor Preview */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-950/40">
              <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                {fileContents[selectedFile].code}
              </pre>
            </div>

            {/* Live API Response Output Panel */}
            <div className="h-56 border-t border-slate-800 bg-slate-950 flex flex-col shrink-0">
              <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-400 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" />
                  Arquitetura de texto · primeira chamada
                </span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  {agentError ? 'ERRO' : modeloUsado ? 'RESPOSTA RECEBIDA' : 'AGUARDANDO'}
                </span>
              </div>
              <div className="flex-1 p-3 overflow-y-auto">
                <pre className="text-[11px] font-mono text-emerald-300">
                  {JSON.stringify(getLiveApiResponse(), null, 2)}
                </pre>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Customer } from '../../types';

import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from 'lucide-react';

interface Screen2ChatProps {
  customer: Customer;
  onBack: () => void;
  onTriggerCommunication: () => void;
  isChaveAtiva: boolean;
  onToggleChave: () => void;
}

export const Screen2Chat: React.FC<Screen2ChatProps> = ({
  customer,
  onBack,
  onTriggerCommunication,
  isChaveAtiva,
  onToggleChave,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const chatData = { saudacao: 'Olá! Este é o i-agora.', tagAtiva: 'PROTÓTIPO', botaoProximo: 'i-agora' };

  const handleEAgoraClick = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onTriggerCommunication();
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6F8] text-slate-800 relative">
      
      {/* Top Header da Auditoria (Limpo: sem fase, sem modo neutro, sem score) */}
      <div className="bg-[#001E62] text-white px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
            title="Voltar para a tela inicial"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-[#EC7000] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              i
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#001E62]"></span>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-white leading-tight">
              i-agora · protótipo
            </h2>
            <p className="text-[10px] text-orange-200">
              Cliente: {customer.nome} (#{customer.id} · {customer.segmento})
            </p>
          </div>
        </div>
      </div>

      {/* Área da Conversa (Diálogo estilo LLM com aceite integrado) */}
      <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto">
        
        {/* Balão do Assistente / LLM */}
        <div className="flex gap-2.5 max-w-[96%]">
          <div className="w-7 h-7 rounded-full bg-[#EC7000] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
            i
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3.5 shadow-xs space-y-3">
            
            {/* Saudação com a Variável Nome */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
              <span className="text-xs font-bold text-[#001E62] leading-snug">
                {chatData.saudacao}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap bg-slate-100 text-slate-600">
                {chatData.tagAtiva}
              </span>
            </div>

            {/* Parágrafo 1 do Texto */}
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              Nenhuma análise financeira foi realizada. Podemos conversar sobre orçamento, reserva ou prevenção de dívidas.
            </p>

            {/* Parágrafo 2 do Texto */}
            <p className="text-xs text-slate-800 leading-relaxed font-medium bg-orange-50/60 p-2.5 rounded-xl border border-orange-100/70">
              Conte o que você gostaria de entender, sem enviar senhas ou dados pessoais. Este protótipo não representa um canal oficial do Itaú.
            </p>

            {/* Pergunta de continuidade do diálogo (Padrão LLM com aceite) */}
            <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Deseja iniciar uma conversa?
              </p>

              {/* Botão "E agora?" no mesmo nível do texto escrito (Aceite de diálogo LLM) */}
              <button
                onClick={handleEAgoraClick}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#EC7000] hover:bg-[#d86300] active:scale-[0.97] text-white font-bold text-xs rounded-xl shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-orange-300 shrink-0"
                aria-label="E agora?"
                title="Aceitar e prosseguir com a próxima etapa da auditoria"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>{chatData.botaoProximo}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>Layout com perfis sintéticos</span>
              <span className="font-semibold text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Diálogo Pronto
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* PARTE ABAIXO COM "STATUS" */}
      {/* Contém: "Chave boolean" e "Grupo de variaveis [A,b,c,d,e]" */}
      {/* 3 campos internos (id, nome, texto 3 camadas com neutro padrão) com estilo "apagado" (dimmed/muted) */}
      <div className="bg-slate-900 border-t border-slate-800 text-slate-300 p-2.5 text-[11px] shrink-0 space-y-2 select-none">
        
        {/* Linha 1: Título de Status & Chave boolean & Grupo de variáveis */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          
          {/* Status Label + Chave boolean */}
          <div className="flex items-center gap-2">
            <span className="font-mono uppercase font-bold text-[10px] text-slate-400 tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Status:
            </span>

            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono">Chave boolean:</span>
              <button
                onClick={onToggleChave}
                className="flex items-center gap-1 text-[10px] font-mono font-bold transition-colors"
                title="Clique para alternar a Chave boolean ON / OFF"
              >
                {isChaveAtiva ? (
                  <>
                    <ToggleRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">true (ON)</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-400">false (OFF)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Grupo de variáveis [A,b,c,d,e] */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono">Grupo de variáveis:</span>
            <span className="text-[10px] font-mono font-bold text-amber-400">
              [A, b, c, d, e]
            </span>
          </div>
        </div>

        {/* Linha 2: Os 3 campos internos (id, nome, texto com 3 camadas - Neutro padrão) em modo "apagado" */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 text-[10px] font-mono opacity-50 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>id: <strong className="text-slate-300">#{customer.id}</strong></span>
            <span>nome: <strong className="text-slate-300">{customer.nome}</strong></span>
            <span className="text-emerald-400/90 font-bold">camada_ativa: TEXTO_1[NEUTRO]</span>
          </div>

          <div className="text-slate-400 truncate border-t border-slate-800/60 pt-1">
            texto (3 camadas): [1: Neutro (padrão ativo), 2: Masc, 3: Fem] · <span className="italic">"Que bom ter você aqui, {customer.primeiroNome}!"</span>
          </div>
        </div>

      </div>

    </div>
  );
};

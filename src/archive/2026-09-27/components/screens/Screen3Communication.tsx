import React, { useState } from 'react';
import { Customer } from '../../types';
import {
  ArrowLeft,
  Send,
  Loader2,
  Clock,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface Screen3CommunicationProps {
  customer: Customer;
  onBackToChat: () => void;
  onRestart: () => void;
  onNextCustomer: () => void;
}

interface MensagemChat {
  id: string;
  papel: 'user' | 'model';
  texto: string;
  horario: string;
}

export const Screen3Communication: React.FC<Screen3CommunicationProps> = ({
  customer,
  onBackToChat,
  onRestart,
  onNextCustomer,
}) => {
  // Data de corte fixa: 22 de dezembro de 2025
  const DATA_CORTE_FIXA = "22 de dezembro de 2025";
  
  // Cálculo do horário casado dentro das 24h de 22/12/2025
  const horaCalculada = ((customer.id * 7 + 9) % 24).toString().padStart(2, '0');
  const minutoCalculado = ((customer.id * 13 + 15) % 60).toString().padStart(2, '0');
  const segundoCalculado = ((customer.id * 19 + 25) % 60).toString().padStart(2, '0');
  const horarioCasado = `${horaCalculada}:${minutoCalculado}:${segundoCalculado}`;

  const [inputTexto, setInputTexto] = useState<string>('');
  const [estaEnviando, setEstaEnviando] = useState<boolean>(false);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([
    {
      id: 'msg-init-1',
      papel: 'model',
      texto: `Olá, ${customer.primeiroNome}! Como seu especialista Itaú, estou aqui para analisar o seu momento financeiro e orientar os seus próximos passos com total clareza e segurança. Como posso te apoiar hoje?`,
      horario: horarioCasado,
    },
  ]);

  const handleEnviarMensagem = () => {
    if (!inputTexto.trim() || estaEnviando) return;

    const mensagemEnviada = inputTexto.trim();
    setInputTexto('');
    setEstaEnviando(true);

    const novaMensagemUsuario: MensagemChat = {
      id: `usr-${Date.now()}`,
      papel: 'user',
      texto: mensagemEnviada,
      horario: horarioCasado,
    };

    setMensagens((prev) => [...prev, novaMensagemUsuario]);

    // Resposta gerada através da arquitetura de Harness do Agente
    setTimeout(() => {
      setEstaEnviando(false);

      // O agente utiliza o contexto interno (score, dados, corte) sem expor números brutos
      let respostaTexto = '';
      const score = customer.scoreComportamental;

      if (mensagemEnviada.toLowerCase().includes('invest') || mensagemEnviada.toLowerCase().includes('guardar')) {
        if (score >= 700) {
          respostaTexto = `Com base nas movimentações do seu perfil, este é um momento oportuno para diversificar em títulos privados de alta liquidez e proteção, como CDBs personalizados com rentabilidade acima do CDI e fundos DI selecionados.`;
        } else {
          respostaTexto = `Para o seu momento, o passo mais estratégico é fortalecer sua reserva de emergência em aplicações de liquidez imediata com proteção FGC, garantindo tranquilidade antes de expandir posições.`;
        }
      } else if (mensagemEnviada.toLowerCase().includes('limite') || mensagemEnviada.toLowerCase().includes('cartão') || mensagemEnviada.toLowerCase().includes('cartao')) {
        respostaTexto = `Analisando seu fluxo de gastos até ${DATA_CORTE_FIXA}, seus limites estão dimensionados para preservar sua flexibilidade sem comprometer despesas essenciais. Se desejar, posso avaliar um remanejamento de limites entre seus produtos Itaú.`;
      } else {
        if (score >= 700) {
          respostaTexto = `Excelente pergunta, ${customer.primeiroNome}. Considerando o seu perfil consolidado no Itaú, recomendo focarmos em soluções que combinem otimização orçamentária e benefícios exclusivos de alta rentabilidade. Gostaria de detalhar os prazos recomendados?`;
        } else {
          respostaTexto = `Compreendo perfeitamente, ${customer.primeiroNome}. O ideal é priorizarmos ações práticas para equilibrar imprevistos cotidianos e manter seu orçamento seguro. Posso te apresentar opções com condições facilitadas para o seu momento?`;
        }
      }

      const novaRespostaAgente: MensagemChat = {
        id: `mod-${Date.now()}`,
        papel: 'model',
        texto: respostaTexto,
        horario: horarioCasado,
      };

      setMensagens((prev) => [...prev, novaRespostaAgente]);
    }, 650);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEnviarMensagem();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6F8] text-slate-800 relative select-none">
      
      {/* Top Header da Auditoria Itaú */}
      <div className="bg-[#001E62] text-white px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToChat}
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
            title="Voltar para a tela anterior"
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
              Especialista Itaú
            </h2>
            <p className="text-[10px] text-orange-200">
              Atendimento Consultivo · {customer.primeiroNome}
            </p>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="text-[11px] bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-md text-white font-medium transition-colors"
          title="Reiniciar para a Tela 1"
        >
          Início
        </button>
      </div>

      {/* ÁREA DE DIÁLOGO / NOVO CHAT DA FASE 3 */}
      {/* Os dados brutos não aparecem aqui: apenas existem internamente como contexto */}
      <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto">
        
        {/* Marcador Discreto de Segurança e Contexto Interno */}
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-white/60 border border-slate-200/80 px-2.5 py-0.5 rounded-full font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Canal Direto · Sessão Protegida
          </span>
        </div>

        {/* Mensagens do Chat */}
        {mensagens.map((msg) => {
          const isModel = msg.papel === 'model';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[92%] ${
                isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs ${
                  isModel
                    ? 'bg-[#EC7000] text-white'
                    : 'bg-[#001E62] text-white'
                }`}
              >
                {isModel ? 'i' : <User className="w-3.5 h-3.5 text-white" />}
              </div>

              {/* Balão */}
              <div
                className={`rounded-2xl p-3 shadow-xs space-y-1.5 ${
                  isModel
                    ? 'bg-white border border-slate-200 rounded-tl-xs text-slate-800'
                    : 'bg-[#001E62] text-white rounded-tr-xs'
                }`}
              >
                <p className="text-xs leading-relaxed font-normal">
                  {msg.texto}
                </p>
                
                <div
                  className={`flex items-center justify-end text-[9px] ${
                    isModel ? 'text-slate-400' : 'text-slate-300'
                  }`}
                >
                  <span>{msg.horario}</span>
                </div>
              </div>
            </div>
          );
        })}

        {estaEnviando && (
          <div className="flex gap-2.5 max-w-[90%] mr-auto">
            <div className="w-7 h-7 rounded-full bg-[#EC7000] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
              i
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3 shadow-xs flex items-center gap-2 text-slate-500 text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EC7000]" />
              <span>O Especialista está digitando...</span>
            </div>
          </div>
        )}

      </div>

      {/* Campo de Envio de Mensagem do Novo Chat */}
      <div className="p-3 bg-white border-t border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputTexto}
            onChange={(e) => setInputTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Envie uma mensagem ao Especialista Itaú..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
          />

          <button
            onClick={handleEnviarMensagem}
            disabled={!inputTexto.trim() || estaEnviando}
            className="w-9 h-9 rounded-xl bg-[#EC7000] hover:bg-[#d86300] disabled:bg-slate-300 text-white flex items-center justify-center transition-all shadow-xs shrink-0"
            title="Enviar mensagem"
            aria-label="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ANOTAÇÃO INFERIOR OBRIGATÓRIA CONFORME DIRETRIZ:
          "Data de corte para contexto + Time" com data fixa em 22 de dezembro de 2025
          e horário casado variando nas 24h.
      */}
      <div className="bg-slate-900 border-t border-slate-800 text-slate-400 px-3.5 py-2 text-[10px] font-mono shrink-0 select-none flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-300 font-bold">Data de corte para contexto + Time:</span>
        </div>

        <div className="flex items-center gap-1.5 text-amber-300 font-bold">
          <span>{DATA_CORTE_FIXA}</span>
          <span className="text-slate-500">·</span>
          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-400">
            {horarioCasado}
          </span>
        </div>
      </div>

    </div>
  );
};

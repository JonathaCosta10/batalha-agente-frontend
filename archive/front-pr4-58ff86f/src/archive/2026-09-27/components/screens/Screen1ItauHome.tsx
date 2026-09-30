import React, { useState } from 'react';
import { Customer } from '../../types';
import {
  Eye,
  EyeOff,
  CreditCard,
  QrCode,
  Send,
  FileText,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Star,
} from 'lucide-react';

interface Screen1ItauHomeProps {
  customer: Customer;
  onOpenChat: () => void;
}

export const Screen1ItauHome: React.FC<Screen1ItauHomeProps> = ({
  customer,
  onOpenChat,
}) => {
  const [showBalance, setShowBalance] = useState<boolean>(true);

  const formattedBalance = customer.saldoEstimado.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const formattedCardLimit = customer.limiteCartao.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className="flex-1 flex flex-col bg-[#F5F6F8] text-slate-800 relative overflow-hidden select-none">
      
      {/* Header Compacto Itaú (Sem score ou CTX-750-Alpha) */}
      <div className="bg-[#001E62] text-white px-4 pt-3 pb-3 shadow-xs shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EC7000] flex items-center justify-center font-black text-white text-base shadow-xs">
              i
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-orange-200 font-medium">Itaú</span>
                <span className="text-[11px] text-white/50">·</span>
                <span className="text-[11px] text-white/90 font-medium">{customer.segmento}</span>
              </div>
              <h2 className="text-sm font-semibold text-white leading-tight">
                Olá, {customer.primeiroNome}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              title={showBalance ? 'Ocultar saldo' : 'Exibir saldo'}
              aria-label="Alternar visibilidade do saldo"
            >
              {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-[10px] font-bold text-white">
              {customer.genero}
            </div>
          </div>
        </div>

        {/* Info Conta */}
        <div className="flex items-center justify-between text-[10px] text-white/70 border-t border-white/10 pt-1.5">
          <span>Ag: {customer.agencia}</span>
          <span>CC: {customer.contaNumero}</span>
          <span>ID #{customer.id}</span>
        </div>
      </div>

      {/* Conteúdo Reduzido / Compacto */}
      <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-start">
        
        {/* Card de Saldo Compacto */}
        <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">Saldo em conta corrente</span>
            <span className="text-[10px] text-[#EC7000] font-semibold">Extrato</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold tracking-tight text-slate-900 font-mono">
              {showBalance ? formattedBalance : 'R$ ••••••••'}
            </div>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
              Ativo
            </span>
          </div>
        </div>

        {/* Grid 4 Ações Rápidas Compactas */}
        <div className="bg-white rounded-xl p-2 shadow-xs border border-slate-200/80">
          <div className="grid grid-cols-4 gap-1 text-center">
            <button className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-orange-50 text-[#EC7000] flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-slate-700">Pix</span>
            </button>

            <button className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-slate-700">Pagar</span>
            </button>

            <button className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-slate-700">Transferir</span>
            </button>

            <button className="flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-slate-700">Cartões</span>
            </button>
          </div>
        </div>

        {/* Card Resumo do Cartão Compacto */}
        <div className="bg-white rounded-xl p-2.5 shadow-xs border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-800">Cartão Itaú</span>
            <span className="text-[10px] text-slate-400">Final 8492</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-0.5">
            <div>
              <span className="text-[10px] text-slate-400 block">Fatura</span>
              <span className="font-bold text-slate-900 font-mono text-[11px]">
                {showBalance ? 'R$ 1.842,30' : 'R$ ••••••'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Limite</span>
              <span className="font-semibold text-slate-700 font-mono text-[11px]">
                {showBalance ? formattedCardLimit : 'R$ ••••••'}
              </span>
            </div>
          </div>
        </div>

        {/* Mini Histórico */}
        <div className="bg-white rounded-xl p-2.5 shadow-xs border border-slate-200/80 space-y-1.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
            Últimas movimentações
          </span>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ArrowDownLeft className="w-3 h-3" />
                </div>
                <span className="text-[11px] text-slate-700 font-medium">Pix Recebido</span>
              </div>
              <span className="font-semibold text-emerald-600 font-mono text-[11px]">+ R$ 350,00</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                  <ArrowUpRight className="w-3 h-3" />
                </div>
                <span className="text-[11px] text-slate-700 font-medium">Débito Mercado</span>
              </div>
              <span className="font-semibold text-slate-700 font-mono text-[11px]">- R$ 142,80</span>
            </div>
          </div>
        </div>

      </div>

      {/* Botão flutuante no canto inferior direito: "Iniciar auditoria" */}
      <div className="absolute bottom-10 right-4 z-30 flex flex-col items-end">
        <div className="mb-1.5 bg-slate-900 text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg shadow-md animate-bounce flex items-center gap-1.5 whitespace-nowrap border border-slate-700">
          <Sparkles className="w-3 h-3 text-[#EC7000]" />
          <span>Iniciar auditoria</span>
        </div>

        <button
          onClick={onOpenChat}
          className="w-13 h-13 rounded-full bg-gradient-to-br from-[#EC7000] to-[#d86300] hover:from-[#d86300] hover:to-[#be5600] text-white shadow-xl shadow-orange-500/40 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-orange-300"
          aria-label="Iniciar auditoria"
          title="Clique para iniciar auditoria (abrir conversa pré-preenchida)"
        >
          <Star className="w-6 h-6 fill-white stroke-white drop-shadow group-hover:rotate-12 transition-transform duration-300" />
        </button>
      </div>

    </div>
  );
};

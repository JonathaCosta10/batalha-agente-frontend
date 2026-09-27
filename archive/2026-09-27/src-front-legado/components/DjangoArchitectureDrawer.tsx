import React, { useEffect, useRef } from 'react';
import type { Customer } from '../types';
import { X } from 'lucide-react';
import { Screen3Communication } from './screens/Screen3Communication';

interface DjangoArchitectureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentCustomer: Customer;
}

/** Development-only contract inspector. No raw Gemini or legacy smoke bypass. */
export const DjangoArchitectureDrawer: React.FC<DjangoArchitectureDrawerProps> = ({ isOpen, onClose, currentCustomer }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (isOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [isOpen]);
  return <dialog ref={dialog} onCancel={onClose} aria-labelledby="inspector-title"
    className="m-auto w-[min(900px,96vw)] h-[90dvh] rounded-3xl bg-slate-900 text-white p-0 backdrop:bg-black/60">
    {isOpen && <div className="h-full flex flex-col min-h-0">
      <div className="p-4 flex items-center justify-between gap-3 border-b border-slate-700">
        <h2 id="inspector-title" className="font-semibold text-sm">i-agora · contrato executável Django</h2>
        <button autoFocus onClick={onClose} aria-label="Fechar inspetor" className="p-2 rounded hover:bg-slate-700"><X className="w-4 h-4" /></button>
      </div>
      <div className="px-4 py-3 text-xs text-slate-300 space-y-2">
        <p>POST /api/v1/context-agent/conversas/mensagens/ · schema 1.0</p>
        <p>Autorização → entrada determinística/semântica → contexto → ADK/Gemini → saída determinística/semântica → ReleaseGate.</p>
        <p>Pacote integrável agent_backend; não é evidência de alteração no Django externo. Sem negociação multiprovedor, métricas fictícias ou dados do seletor.</p>
        <p>Esta conversa usa exatamente o cliente e o gate do chat. Somente respostas públicas liberadas; prompts, eventos internos e credenciais não são expostos.</p>
      </div>
      <div className="flex-1 min-h-0 flex flex-col"><Screen3Communication key={currentCustomer.id} /></div>
    </div>}
  </dialog>;
};

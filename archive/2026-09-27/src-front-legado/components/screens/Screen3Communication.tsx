import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Customer } from '../../types';
import { ArrowLeft, Send, Loader2, User } from 'lucide-react';
import { ConversationController } from '../../services/conversationController';

interface Screen3CommunicationProps {
  customer?: Customer; // Layout demo only. Never sent to API or used for advice.
  controller?: ConversationController;
  onBackToChat?: () => void;
  onRestart?: () => void;
  onNextCustomer?: () => void;
}

const modeLabels = {
  demo: 'DEMO local · resposta fixa, sem IA',
  demo_live: 'TESTE Gemini · somente dados sintéticos',
  live: 'Gemini · sessão autenticada no servidor',
};

function ConversationPanel({ controller: supplied, onBackToChat, onRestart }: Screen3CommunicationProps) {
  const [local] = useState(() => new ConversationController());
  const controller = supplied || local;
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const [inputTexto, setInputTexto] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => () => controller.cancel(), [controller]);
  useEffect(() => { bottom.current?.scrollIntoView?.({ block: 'nearest' }); }, [state.messages, state.loading]);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputTexto.trim() || state.loading) return;
    const text = inputTexto;
    setInputTexto('');
    void controller.send(text);
  };
  const restart = () => { controller.reset(); setInputTexto(''); onRestart?.(); };

  return (
    <section aria-label="Conversa i-agora" className="flex-1 min-h-0 min-w-0 flex flex-col bg-[#F5F6F8] text-slate-800 relative">
      <div className="bg-[#001E62] text-white px-4 py-3 flex items-center justify-between gap-2 shadow-xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBackToChat && <button onClick={onBackToChat} aria-label="Voltar" className="p-2 rounded-full hover:bg-white/10"><ArrowLeft className="w-4 h-4" /></button>}
          <div aria-hidden="true" className="w-8 h-8 rounded-lg bg-[#EC7000] flex items-center justify-center font-bold shrink-0">i</div>
          <div><h1 className="text-sm font-semibold">i-agora</h1><p className="text-xs text-orange-200">Educação financeira contextual</p></div>
        </div>
        <button onClick={restart} className="text-xs bg-white/15 hover:bg-white/25 px-2.5 py-2 rounded-md shrink-0">Nova conversa</button>
      </div>
      <div className="px-4 py-2 border-b border-slate-200 bg-white text-xs text-slate-600 space-y-1">
        <p>Protótipo: não é um canal oficial do Itaú. Não envie senhas, documentos ou dados de terceiros.</p>
        <p className="font-semibold">{state.mode ? modeLabels[state.mode] : 'Conexão com o servidor ainda não verificada'}</p>
      </div>
      <div role="log" aria-label="Histórico da conversa" aria-live="polite" aria-relevant="additions" className="flex-1 min-h-0 p-3.5 space-y-3.5 overflow-y-auto">
        {state.messages.length === 0 && <p className="text-sm text-slate-600 p-3 bg-white rounded-xl border border-slate-200">
          Podemos conversar sobre orçamento, reserva ou prevenção de dívidas. Nenhuma análise financeira foi realizada. O que você gostaria de entender?
        </p>}
        {state.messages.map(msg => <div key={msg.id} className={`flex gap-2 max-w-[96%] ${msg.role === 'model' ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
          <div aria-hidden="true" className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${msg.role === 'model' ? 'bg-[#EC7000]' : 'bg-[#001E62]'} text-white`}>
            {msg.role === 'model' ? 'i' : <User className="w-3.5 h-3.5" />}
          </div>
          <div className={`rounded-2xl p-3 shadow-xs min-w-0 ${msg.role === 'model' ? 'bg-white border border-slate-200' : 'bg-[#001E62] text-white'}`}>
            <span className="sr-only">{msg.role === 'model' ? 'i-agora: ' : 'Você: '}</span>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
            {msg.citations.length > 0 && <details className="mt-2 text-xs"><summary className="cursor-pointer">Fontes e limitações</summary>
              {msg.citations.map(c => <div key={c.id} className="mt-2 break-words space-y-1">
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-800">{c.id}</a>
                <p>{c.excerpt}</p><p>{c.limitations.join(' ')}</p>
              </div>)}
            </details>}
          </div>
        </div>)}
        {state.loading && <p role="status" className="flex items-center gap-2 text-sm text-slate-600"><Loader2 aria-hidden="true" className="w-4 h-4 animate-spin text-[#EC7000]" />Validando a resposta…</p>}
        <div ref={bottom} />
      </div>
      {state.error && <p role="alert" className="px-4 py-2 text-sm text-red-800 bg-red-50">{state.error}</p>}
      {state.canRetry && <button onClick={() => void controller.retry()} className="px-4 py-2 text-sm underline text-[#001E62] bg-white">Tentar entregar a mesma mensagem</button>}
      <form onSubmit={submit} className="p-3 bg-white border-t border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <input type="text" value={inputTexto} maxLength={2000} aria-label="Mensagem para o i-agora" onChange={e => setInputTexto(e.target.value)}
            placeholder="O que você gostaria de entender?" disabled={state.loading}
            className="flex-1 min-w-0 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <button type="submit" disabled={!inputTexto.trim() || state.loading} aria-label="Enviar mensagem"
            className="w-10 h-10 rounded-xl bg-[#EC7000] hover:bg-[#d86300] disabled:bg-slate-300 text-white flex items-center justify-center shrink-0"><Send className="w-4 h-4" /></button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">Até 2.000 caracteres. Sem contratação ou movimentação de dinheiro.</p>
      </form>
    </section>
  );
}

export const Screen3Communication: React.FC<Screen3CommunicationProps> = props => (
  <ConversationPanel key={props.customer?.id ?? 'authenticated'} {...props} />
);

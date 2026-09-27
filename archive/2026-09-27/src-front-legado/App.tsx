import React, { lazy, Suspense, useState } from 'react';
import { Screen3Communication } from './components/screens/Screen3Communication';
import { ConversationController } from './services/conversationController';

// Explicit synthetic app preview; its fixtures never enter the conversation API.
const DemoApp = lazy(() => import('./DemoApp'));
export default function App() {
  const [showLayoutDemo, setShowLayoutDemo] = useState(false);
  const [controller] = useState(() => new ConversationController());
  return <div className="min-h-dvh bg-slate-100 font-sans text-slate-900 flex flex-col">
    {<div className="px-4 py-2 text-xs bg-slate-900 text-white flex flex-wrap gap-2 justify-between">
      <span>Ambiente de teste · i-agora</span>
      <button className="underline" onClick={() => { controller.cancel(); setShowLayoutDemo(!showLayoutDemo); }}>
        {showLayoutDemo ? 'Voltar à conversa' : 'Ver layout legado sintético'}
      </button>
    </div>}
    {showLayoutDemo ? <Suspense fallback={<p role="status">Abrindo layout…</p>}><DemoApp /></Suspense> :
      <main className="w-full max-w-2xl mx-auto flex flex-col flex-1 min-h-0 sm:py-6">
        <div className="flex flex-col h-[calc(100dvh-36px)] sm:h-[min(850px,90dvh)] sm:rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm">
          <Screen3Communication controller={controller} />
        </div>
      </main>}
  </div>;
}

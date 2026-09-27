import type { Saved } from '../../../types';
import { AgoraTrigger } from './AgoraTrigger';
import { CardPanel } from './CardPanel';
import { CommitmentsPanel } from './CommitmentsPanel';
import { FinishPanel } from './FinishPanel';

export type StageHandlers = {
  onEnterAgora:()=>void; onAssume:()=>void; onAdjust:()=>void;
  onSaveCard:(forceDownload:boolean)=>void; onNextPhrase:()=>void; onBackHome:()=>void;
};

// The single call-to-action block the conversation shows for its current stage.
export function StageActions({saved,exporting,handlers}:{saved:Saved;exporting:boolean;handlers:StageHandlers}) {
  const {stage,draft,confirmed,phraseIndex}=saved;
  return <div className="chat-action">
    {stage==='intro'&&<AgoraTrigger onClick={handlers.onEnterAgora}/>}
    {stage==='confirm'&&saved.commitmentCase&&!confirmed&&<CommitmentsPanel commitmentCase={saved.commitmentCase} draft={draft} onAssume={handlers.onAssume} onAdjust={handlers.onAdjust}/>}
    {stage==='card'&&confirmed&&<CardPanel plan={confirmed} phraseIndex={phraseIndex} exporting={exporting} onSave={()=>handlers.onSaveCard(false)} onDownload={()=>handlers.onSaveCard(true)} onNextPhrase={handlers.onNextPhrase} onLeave={handlers.onBackHome}/>}
    {stage==='finish'&&<FinishPanel onBackHome={handlers.onBackHome}/>}
  </div>;
}

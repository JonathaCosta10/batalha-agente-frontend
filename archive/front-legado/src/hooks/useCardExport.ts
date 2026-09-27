import { useState } from 'react';
import { TOAST } from '../data/conversation';
import { downloadCard, shareOrDownloadCard } from '../services/exportCardService';
import type { Plan } from '../types';

export function useCardExport(onDone:()=>void, notify:(text:string)=>void) {
  const [exporting,setExporting]=useState(false);

  const saveCard=async(plan:Plan|null,phraseIndex:number,forceDownload=false)=>{
    if(!plan||exporting)return;
    setExporting(true);
    try {
      const result=forceDownload?await downloadCard(plan,phraseIndex):await shareOrDownloadCard(plan,phraseIndex);
      notify(result==='shared'?TOAST.shared:TOAST.downloaded);
      onDone();
    } catch(error) {
      if(error instanceof DOMException && error.name==='AbortError')notify(TOAST.cancelled);
      else notify(error instanceof Error?error.message:TOAST.exportFailed);
    } finally {setExporting(false);}
  };

  return { exporting, saveCard, resetExport:()=>setExporting(false) };
}

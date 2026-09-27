import { useEffect, useRef } from 'react';
import { isInvite } from '../services/conversationService';
import type { Saved } from '../types';

// Keeps the latest message in view; the invite is anchored at its first paragraph instead.
export function useChatAutoScroll(saved:Saved, typing:boolean) {
  const scrollEnd=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    const behavior=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
    if(saved.stage==='intro' && saved.messages.length===1) {
      scrollEnd.current?.parentElement?.scrollTo({top:0});
    } else if(saved.stage==='invite' && !typing && saved.messages.some(isInvite)) {
      scrollEnd.current?.parentElement?.querySelector('.invite-copy')?.scrollIntoView({block:'start',behavior});
    } else {
      scrollEnd.current?.scrollIntoView({block:'end',behavior});
    }
  },[saved.messages,typing,saved.stage]);
  return scrollEnd;
}

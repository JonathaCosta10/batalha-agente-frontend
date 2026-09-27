import type { Stage } from '../types';

// What the chat shows under the intro. The opening sentence is fetched when the chat opens, but it is only
// released after the "i agora" button (stage leaves 'intro'): before the click there is the button and nothing
// else; after it, the loading/error panel while the opening is not ready, then a short "digitando" and the sentence.
export type ChatPanel = 'actions'|'opening'|'typing'|'error';
export type ChatView = { showMessages:boolean; panel:ChatPanel; composerLocked:boolean };
export const REVEAL_MS = 700;

export function chatView(s:{stage:Stage;openingWaiting:boolean;typing:boolean;revealing:boolean;hasError:boolean}):ChatView {
  if(s.stage==='intro')return {showMessages:false,panel:'actions',composerLocked:true};
  if(s.openingWaiting)return {showMessages:false,panel:'opening',composerLocked:true};
  if(s.revealing)return {showMessages:false,panel:'typing',composerLocked:true};
  if(s.typing)return {showMessages:true,panel:'typing',composerLocked:false};
  return {showMessages:true,panel:s.hasError?'error':'actions',composerLocked:false};
}

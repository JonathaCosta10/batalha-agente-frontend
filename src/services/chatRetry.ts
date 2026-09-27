import type { ScreenError } from './errorScreen';

// The team backend caches every answer, failures included, under (session, conversation, client_message_id)
// and never regenerates under the same id (apps/conversas/service.py `_send`, "no double billing").
// So a resend that reuses the id of a message the server already answered with an error gets that same
// error back forever. Keep the id only when no answer arrived (network, client timeout): there the server
// may have finished, and the same id returns its cached reply instead of paying for a second one.
export const retryMessageId=(screen:Pick<ScreenError,'status'>,id:string,fresh:()=>string=()=>crypto.randomUUID())=>
  screen.status>0?fresh():id;

// One automatic resend when the server asked us to wait (429/503/504 + Retry-After) and the wait is short.
export const AUTO_RETRY_MAX_WAIT_S=30;
export const autoRetryDelayMs=(screen:Pick<ScreenError,'kind'|'retryAfterS'>,alreadyRetried:boolean)=>
  !alreadyRetried&&screen.kind==='busy'&&(screen.retryAfterS??0)<=AUTO_RETRY_MAX_WAIT_S?Math.max(1,screen.retryAfterS??5)*1000:null;

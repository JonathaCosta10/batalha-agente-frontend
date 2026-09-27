export type ConversationMode = 'demo' | 'demo_live' | 'live';
export interface MessageRequest {
  schema_version: '1.0';
  conversation_id: string | null;
  client_message_id: string;
  message: string;
}
export interface Citation {
  id: string;
  url: string;
  excerpt: string;
  limitations: string[];
  status: string;
}
export interface MessageResponse {
  schema_version: '1.0';
  conversation_id: string | null;
  message_id: string;
  request_id: string;
  status: 'ok' | 'needs_clarification' | 'safe_redirect' | 'unavailable';
  reply: string;
  citations: Citation[];
}
export interface ReleasedResult { body: MessageResponse; httpStatus: number }
export interface ConversationTransport {
  bootstrap(signal: AbortSignal): Promise<ConversationMode>;
  send(request: MessageRequest, signal: AbortSignal): Promise<ReleasedResult>;
}

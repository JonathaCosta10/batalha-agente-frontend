import type { ConversationMode, ConversationTransport, MessageRequest, MessageResponse, ReleasedResult } from '../types/conversation';

const BASE = '/api/v1/context-agent/conversas/';
const statusValues = new Set(['ok', 'needs_clarification', 'safe_redirect', 'unavailable']);
const sourceHosts = new Set(['www.bcb.gov.br', 'www.itau.com.br']);

export function isReleasedEnvelope(data: unknown): data is MessageResponse {
  if (!data || typeof data !== 'object') return false;
  const d = data as MessageResponse;
  return d.schema_version === '1.0' && (d.conversation_id === null || typeof d.conversation_id === 'string') &&
    typeof d.message_id === 'string' && typeof d.request_id === 'string' && statusValues.has(d.status) &&
    typeof d.reply === 'string' && d.reply.length > 0 && d.reply.length <= 4000 && Array.isArray(d.citations) &&
    d.citations.length <= 12 && d.citations.every(c => {
      try {
        const url = new URL(c.url);
        return typeof c.id === 'string' && typeof c.excerpt === 'string' && typeof c.status === 'string' &&
          Array.isArray(c.limitations) && c.limitations.every(v => typeof v === 'string') &&
          url.protocol === 'https:' && sourceHosts.has(url.hostname) && !url.username && !url.password;
      } catch { return false; }
    });
}

export class ConversationApi implements ConversationTransport {
  constructor(private fetcher: typeof fetch = (...args) => globalThis.fetch(...args), private cookies = () => document.cookie) {}

  async bootstrap(signal: AbortSignal): Promise<ConversationMode> {
    const response = await this.fetcher(`${BASE}sessao/`, { credentials: 'same-origin', signal });
    const data: unknown = await response.json();
    if (!response.ok || !isReleasedEnvelope(data) || !('mode' in data) ||
        !['demo', 'demo_live', 'live'].includes(String(data.mode))) throw new Error('Session unavailable');
    return data.mode as ConversationMode;
  }

  async send(request: MessageRequest, signal: AbortSignal): Promise<ReleasedResult> {
    const csrf = this.cookies().split('; ').find(c => c.startsWith('csrftoken='))?.slice('csrftoken='.length) || '';
    const response = await this.fetcher(`${BASE}mensagens/`, {
      method: 'POST', credentials: 'same-origin', signal,
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': decodeURIComponent(csrf) },
      body: JSON.stringify(request),
    });
    const data: unknown = await response.json();
    if (!isReleasedEnvelope(data)) throw new Error('Invalid response contract');
    if (request.conversation_id && data.conversation_id && data.conversation_id !== request.conversation_id)
      throw new Error('Conversation mismatch');
    return { body: data, httpStatus: response.status };
  }
}

import type { Citation, ConversationMode, ConversationTransport, MessageRequest } from '../types/conversation';
import { ConversationApi } from './conversationApi';

export interface ChatMessage { id: string; role: 'user' | 'model'; text: string; citations: Citation[] }
interface State {
  messages: ChatMessage[];
  conversationId: string | null;
  mode: ConversationMode | null;
  loading: boolean;
  error: string | null;
  canRetry: boolean;
}
const initial = (): State => ({ messages: [], conversationId: null, mode: null, loading: false, error: null, canRetry: false });

/** Memory only; no financial data in localStorage. Never automatically retry a paid turn. */
export class ConversationController {
  private state: State = initial();
  private listeners = new Set<() => void>();
  private abort?: AbortController;
  private epoch = 0;
  private pending?: MessageRequest;
  constructor(private api: ConversationTransport = new ConversationApi()) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(change: Partial<State>) {
    this.state = { ...this.state, ...change };
    this.listeners.forEach(listener => listener());
  }
  reset = () => {
    this.cancel();
    this.pending = undefined;
    this.state = initial();
    this.listeners.forEach(listener => listener());
  };
  cancel = () => {
    this.epoch++;
    this.abort?.abort();
    this.update({ loading: false, canRetry: !!this.pending });
  };
  send = async (text: string) => {
    if (this.state.loading || !text.trim() || text.length > 2000) return;
    const request: MessageRequest = { schema_version: '1.0', conversation_id: this.state.conversationId,
      client_message_id: crypto.randomUUID(), message: text.trim() };
    this.pending = request;
    this.update({ messages: [...this.state.messages, { id: request.client_message_id, role: 'user', text: request.message, citations: [] }] });
    await this.deliver(request);
  };
  retry = async () => { if (this.pending && !this.state.loading) await this.deliver(this.pending); };
  private async deliver(request: MessageRequest) {
    this.abort?.abort();
    const abort = new AbortController();
    this.abort = abort;
    const epoch = ++this.epoch;
    const timer = setTimeout(() => abort.abort(), 50000);
    this.update({ loading: true, error: null, canRetry: false });
    try {
      const mode = await this.api.bootstrap(abort.signal);
      if (epoch !== this.epoch) return;
      this.update({ mode });
      const result = await this.api.send(request, abort.signal);
      if (epoch !== this.epoch || abort.signal.aborted) return;
      this.pending = undefined;
      this.update({ conversationId: result.body.conversation_id || this.state.conversationId,
        messages: [...this.state.messages, { id: result.body.message_id, role: 'model', text: result.body.reply, citations: result.body.citations }],
        error: result.httpStatus >= 400 ? 'O servidor retornou uma limitação. Nenhuma resposta simulada foi usada.' : null });
    } catch {
      if (epoch !== this.epoch) return;
      this.update({ error: 'Não foi possível confirmar a entrega. Verifique a conexão/autenticação e tente a mesma mensagem novamente.', canRetry: true });
    } finally {
      clearTimeout(timer);
      if (epoch === this.epoch) this.update({ loading: false });
    }
  }
}

import { BotAvatar } from './BotAvatar';

export function TypingIndicator({label='Preparando a próxima resposta…'}:{label?:string}) {
  return <div className="message-group" role="status" aria-live="polite"><BotAvatar/><div className="message-bubble"><div className="typing" aria-hidden="true"><i/><i/><i/></div><span style={{display:'block',fontSize:12,marginTop:8}}>{label}</span></div></div>;
}

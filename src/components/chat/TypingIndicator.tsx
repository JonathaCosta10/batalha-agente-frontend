import { BotAvatar } from './BotAvatar';

export function TypingIndicator() {
  return <div className="message-group"><BotAvatar/><div className="message-bubble typing" aria-label="i.ai está digitando"><i/><i/><i/></div></div>;
}

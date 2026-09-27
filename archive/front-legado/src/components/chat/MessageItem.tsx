import { INVITE_MESSAGE } from '../../data/conversation';
import { isInvite } from '../../services/conversationService';
import type { Message } from '../../types';
import { BotAvatar } from './BotAvatar';
import { InviteCopy } from './InviteCopy';

export function MessageItem({message}:{message:Message}) {
  return <div className={`message-group ${message.by==='user'?'user':''}`}>
    {message.by==='bot'&&<BotAvatar/>}
    <div className="message-bubble" data-testid={`message-${message.id}`}>{isInvite(message)?<InviteCopy text={INVITE_MESSAGE}/>:message.text}</div>
  </div>;
}

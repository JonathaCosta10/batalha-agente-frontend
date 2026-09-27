import { INVITE_MESSAGE } from '../../data/conversation';
import { isInvite } from '../../services/conversationService';
import { DEMO_SEAL } from '../../services/demoReply';
import type { Message } from '../../types';
import { BotAvatar } from './BotAvatar';
import { InviteCopy } from './InviteCopy';
import { RichText } from './RichText';

export function MessageItem({message}:{message:Message}) {
  return <div className={`message-group ${message.by==='user'?'user':''}`}>
    {message.by==='bot'&&<BotAvatar/>}
    <div className="message-bubble" data-testid={`message-${message.id}`}>
      {message.by==='bot'&&message.demo&&<div className="demo-seal" role="note" data-testid="seal-demo-reply">{DEMO_SEAL}</div>}
      {isInvite(message)?<InviteCopy text={INVITE_MESSAGE}/>:message.by==='bot'?<RichText text={message.text}/>:message.text}
    </div>
  </div>;
}

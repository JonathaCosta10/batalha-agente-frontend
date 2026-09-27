import { useEffect, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';

type Props = { typing:boolean; locked?:boolean; restore?:{text:string;nonce:number}|null; onSend:(query:string)=>void };

export function ChatComposer({typing,locked=false,restore=null,onSend}:Props) {
  const [text,setText]=useState('');
  // enviar_como_nova / reformular: a mensagem que falhou volta ao campo.
  useEffect(()=>{if(restore)setText(restore.text);},[restore?.nonce]);
  const submit=(e:FormEvent)=>{
    e.preventDefault();const query=text.trim();if(!query||typing||locked)return;setText('');
    onSend(query);
  };
  return <form className="chat-footer" onSubmit={submit}>
    <div className="composer">
      <textarea data-testid="input-free-text" disabled={locked} aria-label="Escreva uma mensagem" placeholder="Escreva uma mensagem..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit(e);}}} rows={1}/>
      <button className="send-btn" data-testid="button-send-message" disabled={!text.trim()||typing||locked} type="submit" aria-label="Enviar mensagem"><Send size={19}/></button>
    </div>
    <div className="footer-caption">Base sintética do BigQuery · confirme antes de registrar objetivos</div>
  </form>;
}

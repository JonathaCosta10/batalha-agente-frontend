import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';

export function ChatComposer({typing,onSend}:{typing:boolean;onSend:(query:string)=>void}) {
  const [text,setText]=useState('');
  const submit=(e:FormEvent)=>{
    e.preventDefault();const query=text.trim();if(!query||typing)return;setText('');
    onSend(query);
  };
  return <form className="chat-footer" onSubmit={submit}>
    <div className="composer">
      <textarea data-testid="input-free-text" aria-label="Escreva uma mensagem" placeholder="Escreva uma mensagem..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit(e);}}} rows={1}/>
      <button className="send-btn" data-testid="button-send-message" disabled={!text.trim()||typing} type="submit" aria-label="Enviar mensagem"><Send size={19}/></button>
    </div>
    <div className="footer-caption">Base sintética do BigQuery · confirme antes de registrar objetivos</div>
  </form>;
}

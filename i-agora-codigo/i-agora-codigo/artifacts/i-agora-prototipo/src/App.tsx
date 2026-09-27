import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Bell, Check, CheckCircle2, ChevronRight, Download, Eye, EyeOff, MessageCircle, RotateCcw, Search, Send, ShieldCheck, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { BRL, calculations, commitments, INITIAL, INTRO, PHRASES, primaryPhraseCategory, safeLoad, STORAGE_KEY, type Message, type Plan, type Saved, type Stage } from './lib/plan';
import { downloadCard, shareOrDownloadCard } from './lib/export-card';
import { IntroCarousel } from './IntroCarousel';
import { FollowUpScreen } from './FollowUpScreen';

const brand=(name:string)=>`${import.meta.env.BASE_URL}brand/${name}`;
const wait=650;
const navItems=[{label:'Início',icon:'inicio.svg'},{label:'Extrato',icon:'extrato.svg'},{label:'Pagamentos',icon:'transferir.svg'},{label:'Pra você',icon:'presente.svg'},{label:'Menu',icon:'menu.svg'}];
const INVITE_MESSAGE = 'Agora vamos transformar essa oportunidade em um plano.\n\nVamos usar a regra *50-30-20* como referência para organizar seu orçamento e entender como seus gastos podem se distribuir entre necessidades, desejos e futuro.\n\nE tem mais: a partir do seu comportamento financeiro, vamos projetar *quanto tempo pode levar para você chegar a esse cenário* e quais caminhos podem acelerar essa mudança.\n\n*Topa o desafio de descobrir o seu caminho para uma vida financeira mais equilibrada?*';
const PREVIOUS_INVITE_MESSAGE = 'Vamos escolher pequenas mudanças que caibam na sua rotina em janeiro?';
const message=(text:string,by:'bot'|'user'='bot'):Message=>({id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,by,text});
function InviteCopy({text}:{text:string}) {
  return <div className="invite-copy">{text.split('\n\n').map((paragraph,index)=><p key={index}>{paragraph.split(/(\*[^*]+\*)/g).map((part,partIndex)=>part.startsWith('*')&&part.endsWith('*')?<em key={partIndex}>{part.slice(1,-1)}</em>:part)}</p>)}</div>;
}
function Button({children,onClick,variant='primary',disabled,testId}:{children:ReactNode;onClick:()=>void;variant?:'primary'|'outline'|'quiet';disabled?:boolean;testId:string}) {
  return <button data-testid={testId} type="button" className={`${variant}-btn`} onClick={onClick} disabled={disabled}>{children}</button>;
}
function SharePreview({plan,index}:{plan:Plan;index:number}) {
  const phrase=PHRASES[primaryPhraseCategory(plan)][index%PHRASES[primaryPhraseCategory(plan)].length];
  return <div className="preview-card" role="img" aria-label={`Prévia do card: ${phrase} Pequenas mudanças. Mais equilíbrio. Qual vai ser seu próximo passo?`} data-testid="image-share-preview">
    <span className="card-label">JANEIRO / 2026</span><span className="card-symbol" aria-hidden>↗</span><strong className="card-phrase">{phrase}</strong><div className="card-bottom">Pequenas mudanças. Mais equilíbrio.</div><div className="card-invite">Qual vai ser seu próximo passo?</div><div className="card-marks"><img src={brand('itau-referencia.png')} alt="Itaú"/><img src={brand('i-agora.png')} alt="i.agora"/></div>
  </div>;
}
function App() {
  const [saved,setSaved]=useState<Saved>(safeLoad);
  const [chatOpen,setChatOpen]=useState(false);
  const [followOpen,setFollowOpen]=useState(false);
  const [carouselIndex,setCarouselIndex]=useState(0);
  const [typing,setTyping]=useState(false);
  const [text,setText]=useState('');
  const [sheet,setSheet]=useState<'plan'|'reset'|null>(null);
  const [nav,setNav]=useState('Início');
  const [info,setInfo]=useState('');
  const [toast,setToast]=useState('');
  const [hidden,setHidden]=useState(false);
  const [exporting,setExporting]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const scrollEnd=useRef<HTMLDivElement|null>(null);
  useEffect(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));}catch{/* Storage can be unavailable in private mode. */}},[saved]);
  useEffect(()=>{
    const behavior=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
    if(chatOpen && saved.stage==='intro' && saved.messages.length===1) {
      scrollEnd.current?.parentElement?.scrollTo({top:0});
    } else if(chatOpen && saved.stage==='invite' && !typing && saved.messages.some(m=>m.by==='bot'&&(m.text===INVITE_MESSAGE||m.text===PREVIOUS_INVITE_MESSAGE))) {
      scrollEnd.current?.parentElement?.querySelector('.invite-copy')?.scrollIntoView({block:'start',behavior});
    } else {
      scrollEnd.current?.scrollIntoView({block:'end',behavior});
    }
  },[saved.messages,typing,saved.stage,chatOpen]);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
  useEffect(()=>{const id=window.setTimeout(()=>setToast(''),4000);return ()=>clearTimeout(id);},[toast]);
  const update=(fn:(prev:Saved)=>Saved)=>setSaved(prev=>fn(prev));
  const speak=(reply:string,stage:Stage,userReply?:string)=>{
    if(timer.current)clearTimeout(timer.current);
    update(prev=>({...prev,messages:userReply?[...prev.messages,message(userReply,'user')]:prev.messages}));
    setTyping(true);
    timer.current=setTimeout(()=>{setTyping(false);update(prev=>({...prev,stage,messages:[...prev.messages,message(reply)]}));},wait);
  };
  const openChat=()=>{setFollowOpen(false);setChatOpen(true);setNav('Início');setInfo('');};
  const closeChat=()=>setChatOpen(false);
  const enterAgora=()=>speak(INVITE_MESSAGE,'invite');
  const startCommitments=()=>{
    update(p=>({...p,draft:{...p.draft,selected:p.draft.selected.length?p.draft.selected:['delivery']}}));
    speak('Confira os compromissos de exemplo para janeiro de 2026:','confirm','Topo o desafio');
  };
  const record=()=>{
    update(p=>({...p,confirmed:{...p.draft,selected:[...p.draft.selected]}}));
    speak('O primeiro passo já tem nome: uma escolha sua. Preparei um card para marcar esse momento, sem mostrar seus valores pessoais.','card','Assumir meus compromissos');
  };
  const saveCard=async(forceDownload=false)=>{
    if(!saved.confirmed||exporting)return;
    setExporting(true);
    try {
      const result=forceDownload?await downloadCard(saved.confirmed,saved.phraseIndex):await shareOrDownloadCard(saved.confirmed,saved.phraseIndex);
      setToast(result==='shared'?'Compartilhamento concluído.':'Download iniciado. Se quiser salvar em Fotos, abra a imagem baixada e use a opção de salvar do aparelho.');
      speak('Primeiro passo dado, Maria! Seus compromissos de janeiro já estão organizados.','finish','Salvar imagem');
    } catch(error) {
      if(error instanceof DOMException && error.name==='AbortError')setToast('Compartilhamento cancelado. Seu plano continua salvo; tente novamente quando quiser.');
      else setToast(error instanceof Error?error.message:'Não foi possível exportar o card. Tente novamente.');
    } finally {setExporting(false);}
  };
  const sendText=(e:FormEvent)=>{
    e.preventDefault();const query=text.trim();if(!query||typing)return;setText('');
    const normalized=query.toLocaleLowerCase('pt-BR');
    let reply='Entendi, Maria. Podemos continuar o planejamento de janeiro e voltar aos seus compromissos quando quiser.';
    if(normalized.includes('saldo'))reply='O saldo registrado de dezembro é −R$ 380,00. Planejar janeiro não altera esse histórico. Use os controles da conversa para revisar suas estimativas.';
    else if(normalized.includes('ajust')||normalized.includes('valor'))reply='Ainda não consigo ajustar os valores pela conversa. Os compromissos apresentados são estimativas para janeiro.';
    else if(normalized.includes('humano')||normalized.includes('atendimento'))reply='Não consigo iniciar um atendimento por aqui. Você pode continuar o planejamento ou voltar ao início.';
    speak(reply,saved.stage,query);
  };
  const reset=()=>{
    if(timer.current)clearTimeout(timer.current);
    setTyping(false);
    setSaved(INITIAL);
    setCarouselIndex(0);
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(INITIAL));}catch{/* Storage can be unavailable in private mode. */}
    setText('');
    setHidden(false);
    setExporting(false);
    setSheet(null);
    setNav('Início');
    setInfo('');
    setChatOpen(false);
    setFollowOpen(false);
    setToast('Planejamento reiniciado.');
  };
  const viewCard=()=>{setSheet(null);openChat();update(p=>({...p,stage:'card'}));};
  const openFollowUp=()=>{setSheet(null);setFollowOpen(true);window.scrollTo(0,0);};
  const closeFollowUp=()=>{setFollowOpen(false);window.scrollTo(0,0);};
  const navClick=(label:string)=>{setNav(label);setInfo(label==='Início'?'':label);if(label!=='Início')setSheet('plan');};
  const quickAction=(label:string)=>{if(label==='Planejar')openChat();else {setInfo(label);setSheet('plan');}};
  return <div className="app">
    {!chatOpen&&followOpen&&saved.confirmed
      ?<FollowUpScreen plan={saved.confirmed} onBack={closeFollowUp} onOpenChat={openChat}/>
      :!chatOpen?<div className="home">
      <header className="orange-header">
        <div className="topline">
          <div className="account-identity"><div className="account-avatar" aria-hidden="true">M</div><div><span>Maria</span><small>Conta pessoal</small></div></div>
          <div className="header-actions"><button className="icon-btn" aria-label="Buscar" data-testid="button-search" onClick={()=>quickAction('Busca')}><Search size={18}/></button><button className="icon-btn" aria-label="Informações do plano" data-testid="button-notices" onClick={()=>setToast('Seu plano fica salvo neste navegador. Os valores exibidos são estimativas.')}><Bell size={18}/></button><button className="icon-btn" aria-label="Abrir conversa" data-testid="button-header-chat" onClick={openChat}><MessageCircle size={18}/></button></div>
        </div>
         <div className="greeting">Olá, Maria</div><p className="subgreeting">Organizar suas finanças pode ser tão simples quanto bater um papo. Confira por onde começar.</p>
        <button className="conferir-btn" data-testid="button-conferir" onClick={openChat}>Conferir <img src={brand('estrelinha.svg')} alt=""/></button>
      </header>
      <main className="home-content">
        <div className="account-heading"><div className="account-heading-title"><h1>Meu Itaú</h1><img className="brand-img" src={brand('itau-laranja.png')} alt="Itaú"/></div><button className="account-eye" aria-label={hidden?'Mostrar saldo':'Ocultar saldo'} data-testid="button-toggle-balance" onClick={()=>setHidden(v=>!v)}>{hidden?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
        <div className="shortcut-grid" aria-label="Acesso rápido">
          <button className="shortcut" data-testid="button-shortcut-pix" onClick={()=>quickAction('Pix e transferir')}><span className="shortcut-icon-wrap"><img className="shortcut-icon" src={brand('pix.svg')} alt=""/></span><span>Pix e<br/>transferir</span></button>
          <button className="shortcut" data-testid="button-shortcut-pay" onClick={()=>quickAction('Pagamentos')}><span className="shortcut-icon-wrap"><img className="shortcut-icon" src={brand('transferir.svg')} alt=""/></span><span>Pagar</span></button>
          <button className="shortcut" data-testid="button-shortcut-cards" onClick={()=>quickAction('Cartões')}><span className="shortcut-icon-wrap"><img className="shortcut-icon" src={brand('cartao.svg')} alt=""/></span><span>Cartão<br/>virtual</span></button>
          <button className="shortcut" data-testid="button-shortcut-planning" onClick={()=>quickAction('Planejar')}><span className="shortcut-icon-wrap"><SlidersHorizontal size={21}/></span><span>Planejar<br/>janeiro</span></button>
        </div>
        <button className="current-account" data-testid="button-current-account" onClick={()=>quickAction('Conta corrente')}><img src={brand('extrato.svg')} alt=""/>Conta corrente<ChevronRight size={16}/></button>
        <section className="balance-card" aria-label="Saldo do mês de dezembro de 2025">
          <div className="card-heading"><span className="eyebrow">VISÃO DA CONTA</span><span className="period-pill">Dezembro/25</span></div>
          <p className="balance-title">Saldo do mês</p><p className="balance-value" data-testid="text-december-balance">{hidden?'••••••':'−R$ 380,00'}</p>
          <div className="balance-details"><div className="value-row"><span>Entradas</span><b>{hidden?'••••••':'R$ 5.000,00'}</b></div><div className="value-row"><span>Saídas</span><b>{hidden?'••••••':'R$ 5.380,00'}</b></div></div>
        </section>
         {saved.confirmed&&<button type="button" className="follow-card" data-testid="button-iagora-acompanhe" onClick={openFollowUp}><img src={brand('i-agora.png')} alt="i.agora"/><span>Acompanhe</span><ChevronRight size={22} aria-hidden="true"/></button>}
         <div className="notice"><ShieldCheck size={20} style={{flexShrink:0,marginTop:2}}/><div><strong>Um espaço para planejar</strong>Os valores são estimativas. Você decide quais compromissos assumir para janeiro.</div></div>
         <button className="secondary-link" data-testid="button-reset-demo" onClick={()=>setSheet('reset')}>Recomeçar planejamento</button>
      </main>
      <button className="fab" data-testid="button-open-iai" aria-label="Abrir conversa com i.ai" onClick={openChat}><img src={brand('ia-i-original.png')} alt=""/><span className="fab-beta" aria-hidden="true">beta</span></button>
      <nav className="bottom-nav" aria-label="Navegação principal">{navItems.map(({label,icon})=><button key={label} className={`nav-item ${nav===label?'active':''}`} data-testid={`button-nav-${label.toLowerCase().replaceAll(' ','-')}`} aria-current={nav===label?'page':undefined} onClick={()=>navClick(label)}><span className="nav-icon"><img src={brand(icon)} alt=""/></span>{label}</button>)}</nav>
    </div>:<div className="chat">
       <header className="chat-header"><button className="icon-btn" onClick={closeChat} data-testid="button-close-chat" aria-label="Fechar conversa"><ArrowLeft size={22}/></button><div className="chat-avatar"><img src={brand('ia-i-original.png')} alt=""/></div><div className="chat-title"><strong>i.ai <span>com Maria</span></strong><span>Uma conversa para o seu momento</span></div><button className="restart-chat" onClick={reset} data-testid="button-restart-chat" aria-label="Recomeçar conversa e voltar ao início"><RotateCcw size={14}/>Reiniciar</button></header>
      <div className="chat-scroller" role="log" aria-live="polite" aria-relevant="additions">
        <div className="date-divider">Seu espaço de planejamento</div>
        <div className="intro-history-block">
          <div className="message-group intro-message"><div className="mini-avatar"><img src={brand('estrelinha.svg')} alt=""/></div><div className="message-bubble" data-testid="message-intro"><strong className="intro-greeting">{INTRO}</strong></div></div>
          <IntroCarousel active={carouselIndex} onActiveChange={setCarouselIndex}/>
        </div>
        {saved.messages.filter(m=>m.id!=='intro').map(m=><div className={`message-group ${m.by==='user'?'user':''}`} key={m.id}>{m.by==='bot'&&<div className="mini-avatar"><img src={brand('ia-i-original.png')} alt=""/></div>}<div className="message-bubble" data-testid={`message-${m.id}`}>{m.by==='bot'&&(m.text===INVITE_MESSAGE||m.text===PREVIOUS_INVITE_MESSAGE)?<InviteCopy text={INVITE_MESSAGE}/>:m.text}</div></div>)}
        {typing?<div className="message-group"><div className="mini-avatar"><img src={brand('ia-i-original.png')} alt=""/></div><div className="message-bubble typing" aria-label="i.ai está digitando"><i/><i/><i/></div></div>:<div className="chat-action">
          {saved.stage==='intro'&&<button className="agora-trigger" data-testid="button-open-iagora" aria-label="Começar planejamento com i.agora" onClick={enterAgora}><img src={brand('i-agora.png')} alt=""/><ChevronRight size={16}/></button>}
           {saved.stage==='invite'&&<Button testId="button-start-plan" onClick={startCommitments}>Topo o desafio <ArrowRight size={16}/></Button>}
            {saved.stage==='confirm'&&<div className="control-panel"><span className="eyebrow">JANEIRO / 2026</span><h3 style={{fontSize:18,marginTop:6}}>Seus compromissos</h3><ul className="commitment-list">{commitments(saved.draft).map((item,i)=><li key={i}><CheckCircle2 size={17}/>{item}</li>)}</ul><div className="summary-metric"><strong>{BRL(calculations(saved.draft).released)}</strong><span>em gastos planejados a menos; {BRL(calculations(saved.draft).reserve)} dessa disponibilidade será separada para reserva. Não são duas entradas.</span></div><p>Estimativas para janeiro, não gastos já realizados. Só serão registradas se você confirmar.</p><Button testId="button-assume-commitments" onClick={record}>Assumir meus compromissos <Check size={17}/></Button><Button testId="button-adjust-values" variant="outline" onClick={()=>speak('Ainda não consigo ajustar os valores pela conversa. Você pode seguir com os compromissos apresentados.','confirm','Ajustar valores')}>Ajustar valores</Button></div>}
           {saved.stage==='card'&&saved.confirmed&&<div className="control-panel"><h3>Um novo passo merece ser lembrado.</h3><p>Este card não mostra seu saldo, sua renda nem os valores do plano.</p><SharePreview plan={saved.confirmed} index={saved.phraseIndex}/><Button testId="button-save-image" onClick={()=>saveCard()} disabled={exporting}><Download size={17}/>{exporting?'Preparando imagem...':'Salvar imagem'}</Button><Button testId="button-download-image" variant="outline" onClick={()=>saveCard(true)} disabled={exporting}>Baixar PNG</Button><Button testId="button-change-phrase" variant="outline" onClick={()=>update(p=>({...p,phraseIndex:p.phraseIndex+1}))}><Sparkles size={17}/>Gerar outra frase</Button><Button testId="button-return-without-image" variant="quiet" onClick={closeChat}>Voltar ao início sem salvar a imagem</Button></div>}
           {saved.stage==='finish'&&<div className="control-panel"><div className="chat-finish-symbol"><Check size={23}/></div><h3>Seu plano está pronto.</h3><p>Você pode acompanhar seus compromissos na página inicial e voltar a esta conversa quando quiser.</p><Button testId="button-back-home" onClick={closeChat}>Voltar ao início <ArrowRight size={16}/></Button></div>}
        </div>}
        <div ref={scrollEnd}/>
      </div>
       <form className="chat-footer" onSubmit={sendText}><div className="composer"><textarea data-testid="input-free-text" aria-label="Escreva uma mensagem" placeholder="Escreva uma mensagem..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendText(e);}}} rows={1}/><button className="send-btn" data-testid="button-send-message" disabled={!text.trim()||typing} type="submit" aria-label="Enviar mensagem"><Send size={19}/></button></div><div className="footer-caption">Planejamento para janeiro · sem acesso aos dados da conta</div></form>
    </div>}
    {sheet&&<div className="modal-backdrop" onClick={()=>{setSheet(null);setInfo('');}}><div className="modal-sheet" role="dialog" aria-modal="true" aria-label={sheet==='reset'?'Recomeçar planejamento':info||'Meus compromissos financeiros'} onClick={e=>e.stopPropagation()}>
      <button className="icon-btn modal-close" data-testid="button-close-sheet" aria-label="Fechar" onClick={()=>{setSheet(null);setInfo('');}}><X size={22}/></button>
      {sheet==='reset'?<><span className="eyebrow">SEU PLANO</span><h2>Começar de novo?</h2><p>Isso apaga a conversa e os compromissos salvos neste navegador. Os valores de dezembro continuam como ponto de partida.</p><Button testId="button-confirm-reset" onClick={reset}>Recomeçar planejamento</Button><Button testId="button-cancel-reset" variant="outline" onClick={()=>setSheet(null)}>Manter meu plano</Button></>:info?<><span className="eyebrow">SEU PLANO</span><h2>{info}</h2><p>Esta área ainda não está conectada a uma conta bancária. Para continuar, converse com a i.ai sobre seu planejamento de janeiro.</p><Button testId="button-info-chat" onClick={()=>{setSheet(null);setInfo('');openChat();}}>Conversar com i.ai</Button></>:saved.confirmed?<><span className="eyebrow">JANEIRO / 2026</span><h2>Meus compromissos financeiros</h2><p>Este é o plano que você confirmou. O saldo de dezembro permanece −R$ 380,00.</p><ul className="commitment-list">{commitments(saved.confirmed).map((item,i)=><li key={i}><CheckCircle2 size={17}/>{item}</li>)}</ul><div className="summary-metric"><strong>{BRL(calculations(saved.confirmed).released)}</strong><span>de redução planejada nos gastos · reserva prevista: {BRL(calculations(saved.confirmed).reserve)}</span></div><Button testId="button-edit-confirmed-plan" onClick={viewCard}>Ver card no chat <MessageCircle size={17}/></Button><Button testId="button-continue-chat" variant="outline" onClick={()=>{setSheet(null);openChat();}}>Ver conversa</Button></>:<><h2>Ainda não há compromissos</h2><p>Converse com a i.ai para criar seu card.</p><Button testId="button-empty-plan-chat" onClick={()=>{setSheet(null);openChat();}}>Conversar com i.ai</Button></>}
    </div></div>}
    {toast&&<div className="toast" role="status" data-testid="status-toast">{toast}</div>}
  </div>;
}
export default App;
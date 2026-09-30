import { Bell, MessageCircle, Search } from 'lucide-react';
import { ACCOUNT_LABEL } from '../../data/profile';
import { brand } from '../../lib/brand';

type HomeHeaderProps = { firstName:string; onSearch:()=>void; onNotices:()=>void; onOpenChat:()=>void };

export function HomeHeader({firstName,onSearch,onNotices,onOpenChat}:HomeHeaderProps) {
  return <header className="orange-header">
    <div className="topline">
      <div className="account-identity"><div className="account-avatar" aria-hidden="true">{firstName.charAt(0)}</div><div><span>{firstName}</span><small>{ACCOUNT_LABEL}</small></div></div>
      <div className="header-actions">
        <button className="icon-btn" aria-label="Buscar" data-testid="button-search" onClick={onSearch}><Search size={18}/></button>
        <button className="icon-btn" aria-label="Informações do plano" data-testid="button-notices" onClick={onNotices}><Bell size={18}/></button>
        <button className="icon-btn" aria-label="Abrir conversa" data-testid="button-header-chat" onClick={onOpenChat}><MessageCircle size={18}/></button>
      </div>
    </div>
    <div className="greeting">Olá, {firstName}</div><p className="subgreeting">Organizar suas finanças pode ser tão simples quanto bater um papo. Confira por onde começar.</p>
    <button className="conferir-btn" data-testid="button-conferir" onClick={onOpenChat}>Conferir <img src={brand('estrelinha.svg')} alt=""/></button>
  </header>;
}

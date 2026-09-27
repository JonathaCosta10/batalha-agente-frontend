import type { Person } from '../../types';
import { AccountHeading } from './AccountHeading';
import { AssistantFab } from './AssistantFab';
import { BalanceCard } from './BalanceCard';
import { BottomNav } from './BottomNav';
import { CurrentAccountLink } from './CurrentAccountLink';
import { FollowCard } from './FollowCard';
import { HomeHeader } from './HomeHeader';
import { PlanNotice } from './PlanNotice';
import { ShortcutGrid } from './ShortcutGrid';

type HomeScreenProps = {
  person:Person; hasPlan:boolean; hidden:boolean; nav:string;
  onToggleHidden:()=>void; onOpenChat:()=>void; onOpenFollowUp:()=>void; onNotices:()=>void;
  onQuickAction:(label:string)=>void; onNav:(label:string)=>void; onReset:()=>void;
};

export function HomeScreen({person,hasPlan,hidden,nav,onToggleHidden,onOpenChat,onOpenFollowUp,onNotices,onQuickAction,onNav,onReset}:HomeScreenProps) {
  return <div className="home">
    <HomeHeader firstName={person.primeiroNome} onSearch={()=>onQuickAction('Busca')} onNotices={onNotices} onOpenChat={onOpenChat}/>
    <main className="home-content">
      <AccountHeading hidden={hidden} onToggle={onToggleHidden}/>
      <ShortcutGrid onSelect={onQuickAction}/>
      <CurrentAccountLink onClick={()=>onQuickAction('Conta corrente')}/>
      <BalanceCard person={person} hidden={hidden}/>
      {hasPlan&&<FollowCard onClick={onOpenFollowUp}/>}
      <PlanNotice/>
      <button className="secondary-link" data-testid="button-reset-demo" onClick={onReset}>Recomeçar planejamento</button>
    </main>
    <AssistantFab onClick={onOpenChat}/>
    <BottomNav active={nav} onSelect={onNav}/>
  </div>;
}

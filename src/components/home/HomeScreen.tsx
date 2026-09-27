import { displayName, greetingFor } from '../../services/identity';
import type { ProfileStatus } from '../../services/profileLoad';
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
  profileStatus:ProfileStatus; loadStartedAt:number; seal:string; profileError?:string; onRetryProfile:()=>void;
  onToggleHidden:()=>void; onOpenChat:()=>void; onOpenFollowUp:()=>void; onNotices:()=>void;
  onQuickAction:(label:string)=>void; onNav:(label:string)=>void; onReset:()=>void;
};

export function HomeScreen({person,hasPlan,hidden,nav,profileStatus,loadStartedAt,seal,profileError,onRetryProfile,onToggleHidden,onOpenChat,onOpenFollowUp,onNotices,onQuickAction,onNav,onReset}:HomeScreenProps) {
  // The chat cannot start on an empty profile: every entry point stays disabled until the first query resolves.
  const locked=profileStatus!=='ready';
  return <div className="home">
    <HomeHeader firstName={displayName(person)} greeting={greetingFor(person)} locked={locked} onSearch={()=>onQuickAction('Busca')} onNotices={onNotices} onOpenChat={onOpenChat}/>
    <main className="home-content">
      <AccountHeading hidden={hidden} onToggle={onToggleHidden}/>
      <ShortcutGrid locked={locked} onSelect={onQuickAction}/>
      <CurrentAccountLink onClick={()=>onQuickAction('Conta corrente')}/>
      <BalanceCard person={person} hidden={hidden} status={profileStatus} startedAt={loadStartedAt} seal={seal} detail={profileError} onRetry={onRetryProfile}/>
      {hasPlan&&<FollowCard onClick={onOpenFollowUp}/>}
      <PlanNotice/>
      <button className="secondary-link" data-testid="button-reset-demo" disabled={locked} onClick={onReset}>Recomeçar planejamento</button>
    </main>
    <AssistantFab disabled={locked} onClick={onOpenChat}/>
    <BottomNav active={nav} onSelect={onNav}/>
  </div>;
}

import type { LoadStatus } from '../../hooks/usePlanConversation';

// Placeholder with the Home's shape while the profile loads; the text changes when the read is slow.
export function ProfileLoader({status}:{status:LoadStatus}){
  return <section className="profile-loader" aria-busy="true" data-testid="profile-loader">
    <div className="profile-loader-hero"><span className="sk sk-avatar"/><span className="sk sk-line w60"/><span className="sk sk-line w80"/></div>
    <div className="profile-loader-body">
      <span className="sk sk-line w40"/>
      <div className="profile-loader-grid">{[0,1,2,3].map(i=><span key={i} className="sk sk-tile"/>)}</div>
      <span className="sk sk-card"/>
    </div>
    <p className="profile-loader-text" role="status" aria-live="polite">
      {status==='slow'?'Consultando a base de dados. A primeira leitura pode levar alguns segundos.':'Carregando seu perfil…'}
    </p>
  </section>;
}

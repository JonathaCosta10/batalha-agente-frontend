import { brand } from '../../lib/brand';

export function BotAvatar() {
  return <div className="mini-avatar"><img src={brand('ia-i-original.png')} alt=""/></div>;
}

import { BOT } from '../../data/conversation';
import { brand } from '../../lib/brand';
import { IntroCarousel } from './IntroCarousel';

export function IntroBlock({firstName,carouselIndex,onCarouselChange}:{firstName:string|null;carouselIndex:number;onCarouselChange:(index:number)=>void}) {
  return <div className="intro-history-block">
    <div className="message-group intro-message"><div className="mini-avatar"><img src={brand('estrelinha.svg')} alt=""/></div><div className="message-bubble" data-testid="message-intro"><strong className="intro-greeting">{BOT.intro(firstName)}</strong></div></div>
    <IntroCarousel active={carouselIndex} onActiveChange={onCarouselChange}/>
  </div>;
}

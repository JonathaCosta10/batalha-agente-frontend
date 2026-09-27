import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';

const cards = [
  {
    label: 'O SEU MOMENTO',
    title: 'O próximo passo começa agora.',
    body: 'Hoje, seu dinheiro está concentrado no presente. Pequenas mudanças podem abrir espaço para imprevistos e planos futuros.',
  },
  {
    label: 'POR QUE O I.AGORA EXISTE',
    title: 'Do saldo às suas escolhas.',
    body: 'O i.agora existe para transformar números em uma conversa simples: entender seu momento, escolher prioridades e planejar compromissos possíveis, no seu ritmo.',
  },
];

export function IntroCarousel({active,onActiveChange}:{active:number;onActiveChange:(index:number)=>void}) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; index: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // Keep the chosen card visible when the carousel moves into the persistent dock.
  useLayoutEffect(() => {
    const slide = track.current?.children[active] as HTMLElement | undefined;
    if (slide && track.current) track.current.scrollLeft = slide.offsetLeft;
  }, []);

  const goTo = (index: number) => {
    const slide = track.current?.children[index] as HTMLElement | undefined;
    if (slide) track.current?.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
    onActiveChange(index);
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const distance = event.clientX - start.x;
    const index = Math.abs(distance) > 40
      ? Math.max(0, Math.min(cards.length - 1, start.index - Math.sign(distance)))
      : start.index;
    requestAnimationFrame(() => goTo(index));
  };

  return (
    <section className="intro-carousel" aria-label="Conheça o i.agora" aria-roledescription="carrossel" data-testid="carousel-intro">
      <div
        className={`intro-carousel-track${dragging ? ' dragging' : ''}`}
        ref={track}
        tabIndex={0}
        aria-label="Cards de apresentação. Arraste para o lado ou use as setas do teclado."
        onKeyDown={event => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            goTo(Math.max(0, Math.min(cards.length - 1, active + (event.key === 'ArrowRight' ? 1 : -1))));
          }
        }}
        onPointerDown={event => {
          if (event.pointerType !== 'mouse' || event.button !== 0) return;
          drag.current = { x: event.clientX, left: event.currentTarget.scrollLeft, index: active };
          setDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          if (drag.current) event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
        }}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onScroll={event => {
          const el = event.currentTarget;
          const step = (el.children[1] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft;
          if (step) onActiveChange(Math.max(0, Math.min(cards.length - 1, Math.round(el.scrollLeft / step))));
        }}
      >
        {cards.map((card, index) => (
          <article className="intro-carousel-card" key={card.label} role="group" aria-roledescription="slide" aria-label={`${index + 1} de ${cards.length}`} data-testid={`card-intro-${index + 1}`}>
            <span className="intro-carousel-label">{card.label}</span>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </div>
      <div className="intro-carousel-meta">
        <span>Arraste para explorar</span>
        <div className="intro-carousel-progress" aria-label={`Card ${active + 1} de ${cards.length}`}>
          {cards.map((card, index) => (
            <button type="button" className={index === active ? 'active' : ''} key={card.label} aria-label={`Ver card ${index + 1} de ${cards.length}`} aria-current={index === active ? 'step' : undefined} data-testid={`button-intro-card-${index + 1}`} onClick={() => goTo(index)} />
          ))}
        </div>
      </div>
    </section>
  );
}
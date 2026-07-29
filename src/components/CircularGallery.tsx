import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';

import { createLoopGeometry, getLoopPoint } from '../lib/circular-path';

export interface CircularGalleryItem {
  src: string;
  orientation: 'landscape' | 'portrait' | 'square';
  productId?: string;
  label?: string;
}

const CYCLE_MS = 36_000;

export const CircularGallery = ({ items }: { items: readonly CircularGalleryItem[] }) => {
  const uniqueItems = useMemo(() => items.filter((item, index) => items.findIndex((candidate) => candidate.src === item.src) === index), [items]);
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const nodes = itemRefs.current.slice(0, uniqueItems.length).filter((node): node is HTMLElement => Boolean(node));
    if (!stage || !nodes.length) return undefined;

    let animationFrame = 0;
    let geometry = createLoopGeometry(1, 1, 1, 1, nodes.length);
    const measure = () => {
      const stageRect = stage.getBoundingClientRect();
      const cardRects = nodes.map((node) => node.getBoundingClientRect());
      const itemWidth = Math.max(...cardRects.map((rect) => rect.width));
      const itemHeight = Math.max(...cardRects.map((rect) => rect.height));
      geometry = createLoopGeometry(stageRect.width, stageRect.height, itemWidth, itemHeight, nodes.length);
      stage.dataset.perimeter = geometry.perimeter.toFixed(2);
      stage.dataset.cycleMs = String(CYCLE_MS);
    };
    measure();

    if (startTimeRef.current === null) startTimeRef.current = performance.now();
    const animate = (now: number) => {
      const baseProgress = ((now - (startTimeRef.current ?? now)) % CYCLE_MS) / CYCLE_MS;
      nodes.forEach((node, index) => {
        const progress = (baseProgress + index / nodes.length) % 1;
        const point = getLoopPoint(progress, geometry);
        const width = node.offsetWidth;
        const height = node.offsetHeight;
        node.style.transform = `translate3d(${point.x - width / 2}px, ${point.y - height / 2}px, 0)`;
        node.dataset.lane = point.lane;
        node.dataset.progress = progress.toFixed(6);
      });
      animationFrame = requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(stage);
    animationFrame = requestAnimationFrame(animate);
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrame);
    };
  }, [uniqueItems]);

  return (
    <section className="circular-gallery" aria-label="BarMisakiギャラリー">
      <div className="circular-gallery-heading"><span>BAR MISAKI GALLERY</span><b>ONE CONTINUOUS LOOP</b></div>
      <div className="circular-gallery-stage" ref={stageRef}>
        {uniqueItems.map((item, index) => {
          const className = `circular-gallery-item ${item.orientation}${item.productId ? ' product-slide' : ''}`;
          const image = <img src={item.src} alt={item.label ?? `BarMisaki ギャラリー ${index + 1}`} loading="lazy" />;
          return item.productId ? (
            <Link className={className} key={item.src} ref={(node) => { itemRefs.current[index] = node; }} to={`/menu?product=${encodeURIComponent(item.productId)}`} aria-label={`${item.label}を注文する`}>
              {image}<span>ORDER THIS ITEM</span>
            </Link>
          ) : (
            <figure className={className} key={item.src} ref={(node) => { itemRefs.current[index] = node; }}>{image}</figure>
          );
        })}
      </div>
      <div className="circular-gallery-edge circular-gallery-edge-left" aria-hidden="true" />
      <div className="circular-gallery-edge circular-gallery-edge-right" aria-hidden="true" />
    </section>
  );
};

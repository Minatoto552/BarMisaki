import { useEffect, useMemo, useRef, useState } from 'react';

import { createLoopGeometry, getLoopPoint } from '../lib/circular-path';

export interface CircularGalleryItem {
  src: string;
  orientation: 'landscape' | 'portrait' | 'square';
}

const CYCLE_MS = 36_000;
const MAX_FRAME_DELTA_MS = 34;

export const CircularGallery = ({ items }: { items: readonly CircularGalleryItem[] }) => {
  const uniqueItems = useMemo(() => items.filter((item, index) => items.findIndex((candidate) => candidate.src === item.src) === index), [items]);
  const stageRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const elapsedTimeRef = useRef(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: '240px 0px', threshold: 0.01 });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    const stage = stageRef.current;
    const nodes = itemRefs.current.slice(0, uniqueItems.length).filter((node): node is HTMLElement => Boolean(node));
    if (!stage || !nodes.length) return undefined;

    let animationFrame = 0;
    let measureFrame = 0;
    let geometry = createLoopGeometry(1, 1, 1, 1, nodes.length);
    let itemOffsets = nodes.map((_, index) => index / nodes.length);
    let itemSizes = nodes.map(() => ({ width: 1, height: 1 }));
    const measure = () => {
      const stageRect = stage.getBoundingClientRect();
      const cardRects = nodes.map((node) => node.getBoundingClientRect());
      itemSizes = cardRects.map((rect) => ({ width: rect.width, height: rect.height }));
      const itemWidth = Math.max(...cardRects.map((rect) => rect.width));
      const itemHeight = Math.max(...cardRects.map((rect) => rect.height));
      const totalCardWidth = cardRects.reduce((sum, rect) => sum + rect.width, 0);
      geometry = createLoopGeometry(stageRect.width, stageRect.height, itemWidth, itemHeight, nodes.length, 24, totalCardWidth + nodes.length * 24);
      const distributedGap = (geometry.perimeter - totalCardWidth) / nodes.length;
      let cursor = 0;
      itemOffsets = cardRects.map((rect) => {
        const centerOffset = cursor + rect.width / 2;
        cursor += rect.width + distributedGap;
        return centerOffset / geometry.perimeter;
      });
      stage.dataset.perimeter = geometry.perimeter.toFixed(2);
      stage.dataset.cycleMs = String(CYCLE_MS);
    };
    measure();

    let lastFrameTime = performance.now();
    const animate = (now: number) => {
      const frameDelta = Math.min(Math.max(0, now - lastFrameTime), MAX_FRAME_DELTA_MS);
      lastFrameTime = now;
      elapsedTimeRef.current = (elapsedTimeRef.current + frameDelta) % CYCLE_MS;
      const baseProgress = elapsedTimeRef.current / CYCLE_MS;
      nodes.forEach((node, index) => {
        const progress = (baseProgress + itemOffsets[index]) % 1;
        const point = getLoopPoint(progress, geometry);
        const { width, height } = itemSizes[index];
        node.style.transform = `translate3d(${point.x - width / 2}px, ${point.y - height / 2}px, 0)`;
      });
      animationFrame = requestAnimationFrame(animate);
    };

    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(measureFrame);
      measureFrame = requestAnimationFrame(measure);
    });
    resizeObserver.observe(stage);
    animationFrame = requestAnimationFrame(animate);
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(measureFrame);
      cancelAnimationFrame(animationFrame);
    };
  }, [active, uniqueItems]);

  return (
    <section className="menu-marquee circular-gallery" aria-label="BarMisakiギャラリー">
      <div className="circular-gallery-stage" ref={stageRef}>
        {uniqueItems.map((item, index) => <figure className={`circular-gallery-item ${item.orientation}`} key={item.src} ref={(node) => { itemRefs.current[index] = node; }}><img src={item.src} alt={`BarMisaki ギャラリー ${index + 1}`} loading="lazy" decoding="async" fetchPriority="low" /></figure>)}
      </div>
      <div className="circular-gallery-edge circular-gallery-edge-left" aria-hidden="true" />
      <div className="circular-gallery-edge circular-gallery-edge-right" aria-hidden="true" />
    </section>
  );
};

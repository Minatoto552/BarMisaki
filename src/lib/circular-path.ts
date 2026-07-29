export type LoopLane = 'bottom' | 'right-turn' | 'top' | 'left-turn';

export interface LoopGeometry {
  leftX: number;
  rightX: number;
  topY: number;
  bottomY: number;
  horizontalLength: number;
  verticalLength: number;
  perimeter: number;
}

export interface LoopPoint {
  x: number;
  y: number;
  lane: LoopLane;
}

export const createLoopGeometry = (
  containerWidth: number,
  containerHeight: number,
  itemWidth: number,
  itemHeight: number,
  itemCount: number,
  gap = 24,
): LoopGeometry => {
  const edgePadding = Math.max(10, Math.min(28, containerHeight * 0.04));
  const topY = edgePadding + itemHeight / 2;
  const bottomY = containerHeight - edgePadding - itemHeight / 2;
  const verticalLength = Math.max(1, bottomY - topY);
  const minimumHorizontalLength = containerWidth + itemWidth * 2;
  const requiredPerimeter = Math.max(1, itemCount) * (itemWidth + gap);
  const horizontalLength = Math.max(minimumHorizontalLength, (requiredPerimeter - verticalLength * 2) / 2);
  const leftX = (containerWidth - horizontalLength) / 2;
  return {
    leftX,
    rightX: leftX + horizontalLength,
    topY,
    bottomY,
    horizontalLength,
    verticalLength,
    perimeter: horizontalLength * 2 + verticalLength * 2,
  };
};

export const getLoopPoint = (progress: number, geometry: LoopGeometry): LoopPoint => {
  const normalized = ((progress % 1) + 1) % 1;
  let distance = normalized * geometry.perimeter;

  if (distance < geometry.horizontalLength) {
    return { x: geometry.leftX + distance, y: geometry.bottomY, lane: 'bottom' };
  }
  distance -= geometry.horizontalLength;
  if (distance < geometry.verticalLength) {
    return { x: geometry.rightX, y: geometry.bottomY - distance, lane: 'right-turn' };
  }
  distance -= geometry.verticalLength;
  if (distance < geometry.horizontalLength) {
    return { x: geometry.rightX - distance, y: geometry.topY, lane: 'top' };
  }
  distance -= geometry.horizontalLength;
  return { x: geometry.leftX, y: geometry.topY + distance, lane: 'left-turn' };
};

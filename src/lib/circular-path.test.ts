import { describe, expect, it } from 'vitest';

import { createLoopGeometry, getLoopPoint } from './circular-path';

describe('circular gallery path', () => {
  const geometry = createLoopGeometry(1000, 560, 220, 240, 12, 24);

  it('下段は右へ、上段は左へ進む', () => {
    const bottomA = getLoopPoint(0.02, geometry);
    const bottomB = getLoopPoint(0.06, geometry);
    const topStart = (geometry.horizontalLength + geometry.verticalLength) / geometry.perimeter;
    const topA = getLoopPoint(topStart + 0.02, geometry);
    const topB = getLoopPoint(topStart + 0.06, geometry);
    expect(bottomA.lane).toBe('bottom');
    expect(bottomB.x).toBeGreaterThan(bottomA.x);
    expect(topA.lane).toBe('top');
    expect(topB.x).toBeLessThan(topA.x);
  });

  it('右端で上へ、左端で下へつながる', () => {
    const rightTurn = getLoopPoint((geometry.horizontalLength + geometry.verticalLength / 2) / geometry.perimeter, geometry);
    const leftTurn = getLoopPoint((geometry.horizontalLength * 2 + geometry.verticalLength * 1.5) / geometry.perimeter, geometry);
    expect(rightTurn.lane).toBe('right-turn');
    expect(leftTurn.lane).toBe('left-turn');
  });

  it('1周後は同じ座標へ戻り、必要な間隔を確保する', () => {
    expect(getLoopPoint(1, geometry)).toEqual(getLoopPoint(0, geometry));
    expect(geometry.perimeter / 12).toBeGreaterThanOrEqual(244);
    expect(geometry.leftX).toBeLessThan(0);
    expect(geometry.rightX).toBeGreaterThan(1000);
  });

  it.each([1, 3, 30])('商品数が%d件でも等間隔に再計算する', (count) => {
    const resized = createLoopGeometry(390, 390, 170, 150, count, 24);
    expect(resized.perimeter / count).toBeGreaterThanOrEqual(194);
    expect(getLoopPoint(0, resized)).toEqual(getLoopPoint(1, resized));
  });
});

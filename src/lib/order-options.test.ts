import { describe, expect, it } from 'vitest';

import { formatProductName, isTemperatureProduct } from './order-options';

describe('温度オプション', () => {
  it('指定された2商品のみ温度選択商品として扱う', () => {
    expect(isTemperatureProduct('抹茶ラテ')).toBe(true);
    expect(isTemperatureProduct('いちごみるく')).toBe(true);
    expect(isTemperatureProduct('抹茶')).toBe(false);
    expect(isTemperatureProduct('いちごミルク')).toBe(false);
  });

  it('注文スナップショット用の商品名へ温度を付ける', () => {
    expect(formatProductName('抹茶ラテ', { temperature: 'hot' })).toBe(
      '抹茶ラテ（ホット）',
    );
    expect(formatProductName('抹茶ラテ', { temperature: 'iced' })).toBe(
      '抹茶ラテ（アイス）',
    );
  });
});

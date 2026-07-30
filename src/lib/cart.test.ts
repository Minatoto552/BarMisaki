import { describe, expect, it } from 'vitest';

import type { NormalCocktailProduct } from '../types';
import { addCartItem, getCartQuantity, setCartItemQuantity } from './cart';

const product: NormalCocktailProduct = {
  id: 'color-twin', category: 'normal_cocktail', name: 'カラーツイン', imageUrl: '/drink.png',
  createdBy: 'staff', creatorName: 'BarMisaki', isAvailable: true,
  createdAt: '2026-07-30T00:00:00.000Z', updatedAt: '2026-07-30T00:00:00.000Z',
};
const options = { color1: 'red', color2: 'blue', carbonated: true, aphrodisiac: false } as const;

describe('cart quantity', () => {
  it('同じ商品と選択内容は一行にまとめて個数を増やす', () => {
    const once = addCartItem([], product, options);
    const twice = addCartItem(once, product, options);
    expect(twice).toHaveLength(1);
    expect(twice[0].quantity).toBe(2);
    expect(getCartQuantity(twice)).toBe(2);
  });

  it('個数を0にするとカートから取り除く', () => {
    const cart = addCartItem([], product, options);
    expect(setCartItemQuantity(cart, cart[0].id, 0)).toEqual([]);
  });

  it('選択内容が異なる場合は別の商品行にする', () => {
    const first = addCartItem([], product, options);
    const second = addCartItem(first, product, { ...options, carbonated: false });
    expect(second).toHaveLength(2);
  });
});

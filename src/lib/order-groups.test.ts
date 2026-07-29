import { describe, expect, it } from 'vitest';

import type { Order } from '../types';
import { getOrderGroupStatus, groupOrdersByCart } from './order-groups';

const makeOrder = (id: string, cartId: string, status: Order['status'], createdAt: string): Order => ({
  id, cartId, status, createdAt, updatedAt: createdAt, receiptNumber: cartId, tableNumber: '1', orderedBy: 'user-1', ordererName: 'みさき',
  productId: `product-${id}`, productName: `商品${id}`, productImageUrl: '/item.png', category: 'juice',
});

describe('groupOrdersByCart', () => {
  it('同じカートで送信された商品を1つの注文にまとめる', () => {
    const groups = groupOrdersByCart([
      makeOrder('1', '100', 'pending', '2026-07-30T10:00:00.000Z'),
      makeOrder('2', '100', 'pending', '2026-07-30T10:00:01.000Z'),
      makeOrder('3', '101', 'pending', '2026-07-30T10:01:00.000Z'),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups.find((group) => group.id === '100')?.orders).toHaveLength(2);
  });

  it('未対応の商品が残る注文は未対応として扱う', () => {
    expect(getOrderGroupStatus([
      makeOrder('1', '100', 'completed', '2026-07-30T10:00:00.000Z'),
      makeOrder('2', '100', 'pending', '2026-07-30T10:00:01.000Z'),
    ])).toBe('pending');
  });

  it('すべて完了した注文だけを完了として扱う', () => {
    expect(getOrderGroupStatus([
      makeOrder('1', '100', 'completed', '2026-07-30T10:00:00.000Z'),
      makeOrder('2', '100', 'completed', '2026-07-30T10:00:01.000Z'),
    ])).toBe('completed');
  });
});

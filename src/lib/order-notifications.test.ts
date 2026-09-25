import { describe, expect, it } from 'vitest';
import type { Order } from '../types';
import { getOrderNotificationKey } from './order-notifications';

const order = (instance: Order['instance']): Order => ({
  id: `order-${instance ?? 'legacy'}`,
  cartId: 'shared-cart',
  receiptNumber: '12345',
  instance,
  tableNumber: '1',
  productId: 'product-1',
  productName: 'テスト商品',
  productImageUrl: '',
  category: 'food',
  orderedBy: 'user-1',
  ordererName: 'テストユーザー',
  status: 'pending',
  createdAt: '2026-09-25T00:00:00.000Z',
  updatedAt: '2026-09-25T00:00:00.000Z',
});

describe('getOrderNotificationKey', () => {
  it('同じcartIdでも第1・第2インスタンスを別の注文として扱う', () => {
    expect(getOrderNotificationKey(order('first'))).not.toBe(
      getOrderNotificationKey(order('second')),
    );
  });

  it('インスタンス未設定の旧注文にも安定したキーを返す', () => {
    expect(getOrderNotificationKey(order(undefined))).toBe('legacy:shared-cart');
  });
});

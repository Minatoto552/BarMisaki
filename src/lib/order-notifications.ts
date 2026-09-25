import type { Order } from '../types';

export const getOrderNotificationKey = (order: Order): string =>
  `${order.instance ?? 'legacy'}:${order.cartId || order.id}`;


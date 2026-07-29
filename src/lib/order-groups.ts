import type { Order, OrderStatus } from '../types';

export interface OrderGroup {
  id: string;
  orders: Order[];
  receiptNumber: string;
  tableNumber: string;
  ordererName: string;
  createdAt: string;
  status: OrderStatus;
}

export const getOrderGroupStatus = (orders: Order[]): OrderStatus => {
  if (orders.some((order) => order.status === 'pending')) return 'pending';
  if (orders.some((order) => order.status === 'preparing')) return 'preparing';
  return 'completed';
};

export const groupOrdersByCart = (orders: Order[]): OrderGroup[] => {
  const grouped = new Map<string, Order[]>();
  orders.forEach((order) => {
    const key = order.cartId || order.id;
    grouped.set(key, [...(grouped.get(key) ?? []), order]);
  });

  return [...grouped.entries()].map(([id, cartOrders]) => {
    const sortedOrders = [...cartOrders].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    const first = sortedOrders[0];
    return {
      id,
      orders: sortedOrders,
      receiptNumber: first.receiptNumber,
      tableNumber: first.tableNumber,
      ordererName: first.ordererName,
      createdAt: first.createdAt,
      status: getOrderGroupStatus(sortedOrders),
    };
  }).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
};

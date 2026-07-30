import type { CartItem, OrderOptions, Product } from '../types';

const sameOptions = (left: OrderOptions, right: OrderOptions) =>
  left.color1 === right.color1
  && left.color2 === right.color2
  && left.carbonated === right.carbonated
  && left.aphrodisiac === right.aphrodisiac;

export const addCartItem = (cart: CartItem[], product: Product, options: OrderOptions): CartItem[] => {
  const existing = cart.find((item) => item.product.id === product.id && sameOptions(item.options, options));
  if (!existing) return [...cart, { id: crypto.randomUUID(), product, options, quantity: 1 }];
  return cart.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item);
};

export const setCartItemQuantity = (cart: CartItem[], id: string, quantity: number): CartItem[] => {
  if (quantity <= 0) return cart.filter((item) => item.id !== id);
  return cart.map((item) => item.id === id ? { ...item, quantity } : item);
};

export const getCartQuantity = (cart: CartItem[]) => cart.reduce((total, item) => total + item.quantity, 0);

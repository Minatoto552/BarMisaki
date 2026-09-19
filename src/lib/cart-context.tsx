import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, OrderInstance, OrderOptions, Product } from "../types";
import { addCartItem, getCartQuantity, setCartItemQuantity } from "./cart";
interface CartValue {
  items: CartItem[];
  table: string;
  instance: OrderInstance | "";
  quantity: number;
  setTable: (value: string) => void;
  setInstance: (value: OrderInstance | "") => void;
  add: (product: Product, options?: OrderOptions, quantity?: number) => void;
  change: (id: string, quantity: number) => void;
  clear: () => void;
}
const Context = createContext<CartValue | null>(null);
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [table, setTable] = useState("");
  const [instance, setInstance] = useState<OrderInstance | "">("");
  const value = useMemo<CartValue>(
    () => ({
      items,
      table,
      instance,
      setTable,
      setInstance,
      quantity: getCartQuantity(items),
      add: (product, options = {}, quantity = 1) =>
        setItems((current) => addCartItem(current, product, options, quantity)),
      change: (id, quantity) =>
        setItems((current) => setCartItemQuantity(current, id, quantity)),
      clear: () => {
        setItems([]);
        setTable("");
        setInstance("");
      },
    }),
    [items, table, instance],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
};
// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(Context);
  if (!context) throw new Error("CartProvider is required");
  return context;
};

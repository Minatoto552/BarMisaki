import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { OrderProductCard } from "./OrderProductCard";
import type { Product } from "../types";
const product: Product = {
  id: "a",
  category: "juice",
  name: "お水",
  imageUrl: "",
  isAvailable: true,
  createdBy: "u",
  creatorName: "u",
  createdAt: "",
  updatedAt: "",
};
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("コンパクト表示では画像DOMを作らず、画像表示の欠損画像はアイコンにする", () => {
  const onChoose = vi.fn();
  const { container, rerender } = render(
    <OrderProductCard product={product} mode="compact" onChoose={onChoose} />,
  );
  expect(container.querySelector(".pos-product-image")).toBeNull();
  rerender(
    <OrderProductCard product={product} mode="image" onChoose={onChoose} />,
  );
  expect(screen.getByLabelText("商品画像なし")).toBeInTheDocument();
  rerender(
    <OrderProductCard
      product={{ ...product, imageUrl: "/broken.png" }}
      mode="image"
      onChoose={onChoose}
    />,
  );
  fireEvent.error(container.querySelector("img")!);
  expect(screen.getByLabelText("商品画像なし")).toBeInTheDocument();
  rerender(<OrderProductCard product={product} mode="image" onChoose={onChoose} />);
  expect(container.querySelector(".pos-product-image")).not.toBeNull();
});
it("＋を押しても1回だけ追加し、強調表示を180ms後に解除する", () => {
  vi.useFakeTimers();
  const onChoose = vi.fn();
  const { container } = render(
    <OrderProductCard product={product} mode="compact" onChoose={onChoose} />,
  );
  fireEvent.click(container.querySelector(".product-add-icon")!);
  expect(onChoose).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button")).toHaveClass("product-pressed");
  act(() => vi.advanceTimersByTime(180));
  expect(screen.getByRole("button")).not.toHaveClass("product-pressed");
});

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
it("画像未登録や読込失敗はアイコンにし、常に小さい画像領域を表示する", () => {
  const onChoose = vi.fn();
  const { container, rerender } = render(
    <OrderProductCard product={product} onChoose={onChoose} />,
  );
  expect(screen.getByLabelText("商品画像なし")).toBeInTheDocument();
  rerender(
    <OrderProductCard
      product={{ ...product, imageUrl: "/broken.png" }}
      onChoose={onChoose}
    />,
  );
  fireEvent.error(container.querySelector("img")!);
  expect(screen.getByLabelText("商品画像なし")).toBeInTheDocument();
  rerender(<OrderProductCard product={product} onChoose={onChoose} />);
  expect(container.querySelector(".pos-product-image")).not.toBeNull();
});
it("＋を押しても1回だけ追加し、強調表示を180ms後に解除する", () => {
  vi.useFakeTimers();
  const onChoose = vi.fn();
  const { container } = render(
    <OrderProductCard product={product} onChoose={onChoose} />,
  );
  fireEvent.click(container.querySelector(".product-add-icon")!);
  expect(onChoose).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button")).toHaveClass("product-pressed");
  act(() => vi.advanceTimersByTime(180));
  expect(screen.getByRole("button")).not.toHaveClass("product-pressed");
});

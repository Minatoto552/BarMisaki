import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider } from "../lib/cart-context";
import { MenuPage } from "./MenuPage";
const state = vi.hoisted(() => ({
  placeCart: vi.fn(),
  profile: { displayName: "テスト" },
}));
vi.mock("../lib/data", () => ({
  useData: () => ({
    ...state,
    ready: true,
    orders: [],
    products: [
      {
        id: "juice",
        name: "ソーダ",
        category: "juice",
        imageUrl: "/x.png",
        isAvailable: true,
      },
      {
        id: "matcha-latte",
        name: "抹茶ラテ",
        category: "juice",
        imageUrl: "/matcha.png",
        isAvailable: true,
      },
      {
        id: "strawberry-milk",
        name: "いちごみるく",
        category: "juice",
        imageUrl: "/strawberry.png",
        isAvailable: true,
      },
    ],
  }),
}));
const open = () =>
  render(
    <MemoryRouter>
      <CartProvider>
        <MenuPage />
      </CartProvider>
    </MemoryRouter>,
  );
afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
  state.placeCart.mockResolvedValue("12345");
});
describe("POS注文フロー", () => {
  it("コンパクトを標準にし、画像切替後も検索・カテゴリー・並び順・カートを維持する", () => {
    open();
    const catalog = screen.getByRole("region", { name: "商品一覧" });
    expect(catalog.querySelector('img[src="/x.png"]')).toBeNull();
    expect(catalog.querySelector(".compact-product-grid")).not.toBeNull();
    fireEvent.click(
      screen
        .getByRole("button", { name: "ソーダをカートに追加" })
        .querySelector(".product-add-icon")!,
    );
    fireEvent.click(screen.getByRole("button", { name: "ジュース" }));
    fireEvent.change(screen.getByRole("textbox", { name: "商品を検索" }), {
      target: { value: "ソーダ" },
    });
    fireEvent.change(screen.getByLabelText("並び順"), {
      target: { value: "name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "画像" }));
    expect(catalog.querySelector('img[src="/x.png"]')).not.toBeNull();
    expect(screen.getByRole("textbox", { name: "商品を検索" })).toHaveValue(
      "ソーダ",
    );
    expect(screen.getByRole("button", { name: "ジュース" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("並び順")).toHaveValue("name");
    expect(screen.getByRole("button", { name: "画像" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("region", { name: "現在の注文内容" }),
    ).toHaveTextContent("ソーダ");
    expect(
      screen.getByRole("button", { name: "ソーダを1個減らす" }).parentElement,
    ).toHaveTextContent("1");
  });
  it("カードから即時追加し、確認までは送信しない。18番・数量2を送る", async () => {
    open();
    fireEvent.click(
      screen.getByRole("button", { name: "ソーダをカートに追加" }),
    );
    const cart = within(screen.getByRole("region", { name: "現在の注文内容" }));
    fireEvent.click(cart.getByRole("button", { name: "ソーダを1個増やす" }));
    fireEvent.change(cart.getByLabelText(/テーブル番号/), {
      target: { value: "18" },
    });
    expect(cart.getAllByRole("option")).toHaveLength(19);
    fireEvent.click(cart.getByRole("button", { name: "注文内容を確認" }));
    expect(state.placeCart).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toHaveTextContent("×2");
    fireEvent.click(screen.getByRole("button", { name: "注文を送信" }));
    await waitFor(() =>
      expect(state.placeCart).toHaveBeenCalledWith(
        [expect.objectContaining({ quantity: 2 })],
        "18",
      ),
    );
    expect(await screen.findByText("#12345")).toBeInTheDocument();
  });
  it("テーブル未選択では送信できず、0個でカートから除く", () => {
    open();
    fireEvent.click(
      screen.getByRole("button", { name: "ソーダをカートに追加" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "注文内容を確認" }));
    expect(screen.getByRole("button", { name: "注文を送信" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    fireEvent.click(screen.getByRole("button", { name: "ソーダを1個減らす" }));
    expect(
      screen.getByRole("button", { name: "注文内容を確認" }),
    ).toBeDisabled();
  });
  it("検索・Ctrl K・ノーマルの必須設定を維持する", () => {
    open();
    const input = screen.getByRole("textbox", { name: "商品を検索" });
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: "ジュース" } });
    expect(
      screen.getByRole("button", { name: "ソーダをカートに追加" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "カラーツインをカスタマイズ" }),
    ).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(
      screen.getByRole("button", { name: "カラーツインをカスタマイズ" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "カートに追加" }));
    expect(screen.getByRole("alert")).toHaveTextContent("1色目");
  });
  it("送信失敗時もカートと確認内容を残す", async () => {
    state.placeCart.mockRejectedValue(new Error("接続エラー"));
    open();
    fireEvent.click(
      screen.getByRole("button", { name: "ソーダをカートに追加" }),
    );
    fireEvent.change(screen.getByLabelText(/テーブル番号/), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "注文内容を確認" }));
    fireEvent.click(screen.getByRole("button", { name: "注文を送信" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("接続エラー");
    expect(screen.getByRole("dialog")).toHaveTextContent("ソーダ");
  });

  it("抹茶ラテは温度選択後に追加し、温度別に分けて同じ温度をまとめる", async () => {
    open();
    const addMatcha = (temperature: "ホット" | "アイス") => {
      fireEvent.click(
        screen.getByRole("button", { name: "抹茶ラテの温度を選択" }),
      );
      const dialog = within(screen.getByRole("dialog"));
      fireEvent.click(dialog.getByRole("button", { name: temperature }));
      fireEvent.click(dialog.getByRole("button", { name: "カートに追加" }));
    };
    fireEvent.click(
      screen.getByRole("button", { name: "抹茶ラテの温度を選択" }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "カートに追加",
      }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "ホットまたはアイス",
    );
    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    addMatcha("ホット");
    addMatcha("アイス");
    addMatcha("ホット");
    const cart = within(screen.getByRole("region", { name: "現在の注文内容" }));
    expect(cart.getByText("抹茶ラテ（ホット）")).toBeInTheDocument();
    expect(cart.getByText("抹茶ラテ（アイス）")).toBeInTheDocument();
    expect(
      cart.getByRole("button", { name: "抹茶ラテ（ホット）を1個減らす" })
        .parentElement,
    ).toHaveTextContent("2");
    fireEvent.change(cart.getByLabelText(/テーブル番号/), {
      target: { value: "1" },
    });
    fireEvent.click(cart.getByRole("button", { name: "注文内容を確認" }));
    fireEvent.click(screen.getByRole("button", { name: "注文を送信" }));
    await waitFor(() =>
      expect(state.placeCart).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            options: { temperature: "hot" },
            quantity: 2,
          }),
          expect.objectContaining({
            options: { temperature: "iced" },
            quantity: 1,
          }),
        ]),
        "1",
      ),
    );
  });
});

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "../lib/cart-context";
import { TABLE_NUMBERS } from "../lib/table-numbers";
import { colorLabels, type OrderOptions } from "../types";
export const OptionSummary = ({ options }: { options: OrderOptions }) =>
  options.color1 && options.color2 ? (
    <span className="option-summary">
      <i className={`mini-color color-${options.color1}`} />
      {colorLabels[options.color1]} ＋{" "}
      <i className={`mini-color color-${options.color2}`} />
      {colorLabels[options.color2]} / 炭酸{" "}
      {options.carbonated ? "あり" : "なし"} / 媚薬{" "}
      {options.aphrodisiac ? "あり" : "なし"}
    </span>
  ) : null;
export const CartPanel = ({ onReview }: { onReview: () => void }) => {
  const { items, table, setTable, quantity, change } = useCart();
  return (
    <section className="cart-panel" aria-label="現在の注文内容">
      <header>
        <div>
          <span className="eyebrow">TABLE SERVICE / CURRENT ORDER</span>
          <h2>注文内容</h2>
        </div>
        <span className="count-badge" key={quantity}>
          {quantity}点
        </span>
      </header>
      <div className="cart-items">
        {items.length ? (
          items.map((item) => (
            <article className="cart-line" key={item.id}>
              <div className="cart-line-heading">
                <strong>{item.product.name}</strong>
                <button
                  className="icon-button muted"
                  onClick={() => change(item.id, 0)}
                  aria-label={`${item.product.name}をカートから削除`}
                >
                  <Trash2 />
                </button>
              </div>
              <OptionSummary options={item.options} />
              <div
                className="quantity-stepper"
                aria-label={`${item.product.name}の個数`}
              >
                <button
                  onClick={() => change(item.id, item.quantity - 1)}
                  aria-label={`${item.product.name}を1個減らす`}
                >
                  <Minus />
                </button>
                <output>{item.quantity}</output>
                <button
                  disabled={item.quantity >= 99}
                  onClick={() => change(item.id, item.quantity + 1)}
                  aria-label={`${item.product.name}を1個増やす`}
                >
                  <Plus />
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="cart-empty">
            <ShoppingBag />
            <h3>商品を選んでください</h3>
            <p>追加した商品がここに表示されます。</p>
            <small>接客中のテーブルの注文を、まとめて確認できます。</small>
          </div>
        )}
      </div>
      <footer>
        <label className="field">
          <span>
            テーブル番号 <b>必須</b>
          </span>
          <select value={table} onChange={(e) => setTable(e.target.value)}>
            <option value="">1〜18から選択</option>
            {TABLE_NUMBERS.map((number) => (
              <option value={number} key={number}>
                テーブル {number}
              </option>
            ))}
          </select>
        </label>
        <div className="cart-total">
          <span>商品数</span>
          <b>{quantity}点</b>
        </div>
        <button
          className="primary-button"
          disabled={!quantity}
          onClick={onReview}
        >
          注文内容を確認
        </button>
        <small>確認画面から注文を送信します。</small>
      </footer>
    </section>
  );
};

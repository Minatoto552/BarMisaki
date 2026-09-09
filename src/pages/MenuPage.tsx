import {
  Check,
  Flame,
  LayoutGrid,
  List,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Snowflake,
} from "lucide-react";
import {
  OrderProductCard,
  type ProductViewMode,
} from "../components/OrderProductCard";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Modal } from "../components/Modal";
import { CartPanel, OptionSummary } from "../components/CartPanel";
import { useCart } from "../lib/cart-context";
import { useData } from "../lib/data";
import { builtInNormalCocktail } from "../lib/sample-data";
import { filterMenuProducts } from "../lib/menu-search";
import {
  formatProductName,
  isDrinkTemperature,
  isTemperatureProduct,
} from "../lib/order-options";
import { validateOrderOptions, validateTableNumber } from "../lib/validation";
import {
  categoryLabels,
  cocktailColors,
  colorLabels,
  productCategories,
  type OrderOptions,
  type Product,
  type ProductCategory,
} from "../types";
export const MenuPage = () => {
  const { profile, products, orders, placeCart, ready } = useData();
  const cart = useCart();
  const navigate = useNavigate();
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");
  const [viewMode, setViewMode] = useState<ProductViewMode>(() => {
    try {
      return localStorage.getItem("barmisaki-product-view") === "image"
        ? "image"
        : "compact";
    } catch {
      return "compact";
    }
  });
  const changeView = (mode: ProductViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("barmisaki-product-view", mode);
    } catch {
      /* Private browsing may disable storage. */
    }
  };
  const [selected, setSelected] = useState<Product | null>(null);
  const [options, setOptions] = useState<OrderOptions>({});
  const [quantity, setQuantity] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [review, setReview] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const sending = useRef(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (document.querySelector('[role="dialog"]')) return;
        searchInput.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const allProducts = useMemo(
    () =>
      products.some((p) => p.category === "normal_cocktail" && p.isAvailable)
        ? products
        : [builtInNormalCocktail, ...products],
    [products],
  );
  const visible = useMemo(() => {
    const items = filterMenuProducts(allProducts, category, search);
    if (sort === "default") return items;
    if (sort === "name")
      return [...items].sort((a, b) => a.name.localeCompare(b.name, "ja"));
    if (sort === "category")
      return [...items].sort(
        (a, b) =>
          productCategories.indexOf(a.category) -
            productCategories.indexOf(b.category) ||
          a.name.localeCompare(b.name, "ja"),
      );
    const counts = new Map<string, number>();
    orders.forEach((o) =>
      counts.set(o.productId, (counts.get(o.productId) || 0) + 1),
    );
    return [...items].sort(
      (a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0),
    );
  }, [allProducts, category, search, sort, orders]);
  const add = (product: Product, choices: OrderOptions = {}, amount = 1) => {
    cart.add(product, choices, amount);
    setNotice(`${formatProductName(product.name, choices)} ×${amount} をカートに追加しました`);
  };
  const choose = (product: Product) => {
    if (!profile) {
      navigate("/account", {
        state: { notice: "注文する前に、名前とアイコンを登録してください。" },
      });
      return;
    }
    if (
      !isTemperatureProduct(product.name) &&
      product.category !== "normal_cocktail"
    ) {
      add(product);
      return;
    }
    setSelected(product);
    setOptions({});
    setQuantity(1);
    setErrors([]);
  };
  const configure = () => {
    if (!selected) return;
    const next = isTemperatureProduct(selected.name)
      ? isDrinkTemperature(options.temperature)
        ? []
        : ["ホットまたはアイスを選択してください。"]
      : validateOrderOptions(selected.category, options);
    setErrors(next);
    if (next.length) return;
    add(selected, options, quantity);
    setSelected(null);
  };
  const startReview = () => {
    setErrors([]);
    setCartOpen(false);
    setReview(true);
  };
  const submit = async () => {
    if (sending.current) return;
    const error = validateTableNumber(cart.table);
    if (error || !cart.quantity) {
      setErrors([error || "商品を追加してください。"]);
      return;
    }
    sending.current = true;
    setBusy(true);
    setErrors([]);
    try {
      const number = await placeCart(cart.items, cart.table);
      setReceipt(number);
      cart.clear();
      setReview(false);
    } catch (reason) {
      setErrors([
        reason instanceof Error ? reason.message : "送信に失敗しました。",
      ]);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="page order-page">
      <div className="order-workspace">
        <section className="catalog" aria-label="商品一覧">
          <header className="page-heading">
            <div>
              <span className="eyebrow">THE LOUNGE / ORDER SELECTION</span>
              <h1>注文</h1>
              <p>心を込めた一杯を、ゲストのテーブルへ。</p>
            </div>
            <label className="search-box">
              <Search />
              <input
                ref={searchInput}
                aria-label="商品を検索"
                placeholder="商品を検索"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>⌘ / Ctrl K</kbd>
            </label>
          </header>
          <div className="catalog-toolbar">
            <div className="category-tabs" aria-label="商品カテゴリー">
              {(["all", ...productCategories] as const).map((value) => (
                <button
                  key={value}
                  aria-pressed={category === value}
                  className={category === value ? "active" : ""}
                  onClick={() => setCategory(value)}
                >
                  {value === "all"
                    ? "すべて"
                    : value === "normal_cocktail"
                      ? "ノーマル"
                      : value === "original_cocktail"
                        ? "オリジナル"
                        : categoryLabels[value]}
                </button>
              ))}
            </div>
            <label className="sort-label">
              並び順
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="default">登録順</option>
                <option value="name">名前順</option>
                <option value="category">カテゴリー順</option>
                <option value="popular">よく注文される順</option>
              </select>
            </label>
          </div>
          <div className="catalog-caption">
            <span>{search ? "全カテゴリーの検索結果" : "メニュー"}</span>
            <div className="catalog-view-tools">
              <span>{visible.length}商品</span>
              <div
                className="product-view-switch"
                role="group"
                aria-label="商品の表示方法"
              >
                <button
                  aria-pressed={viewMode === "compact"}
                  onClick={() => changeView("compact")}
                >
                  <List />
                  コンパクト
                </button>
                <button
                  aria-pressed={viewMode === "image"}
                  onClick={() => changeView("image")}
                >
                  <LayoutGrid />
                  画像
                </button>
              </div>
            </div>
          </div>
          {!ready ? (
            <p role="status">商品を読み込んでいます…</p>
          ) : visible.length ? (
            <div
              className={`pos-product-grid ${viewMode === "compact" ? "compact-product-grid" : "image-product-grid"}`}
            >
              {visible.map((product) => (
                <OrderProductCard
                  key={product.id}
                  product={product}
                  mode={viewMode}
                  onChoose={choose}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search />
              <h2>商品が見つかりません</h2>
              <p>検索条件やカテゴリーを変更してください。</p>
              <button
                className="secondary-button"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
              >
                検索をクリア
              </button>
            </div>
          )}
        </section>
        <aside className="desktop-cart">
          <CartPanel onReview={startReview} />
        </aside>
      </div>
      <button
        className="mobile-cart-button"
        onClick={() => {
          setCartOpen(true);
          setErrors([]);
        }}
      >
        <ShoppingBag />
        <span>注文内容を見る</span>
        <b>{cart.quantity}点</b>
      </button>
      {notice && (
        <div className="toast" role="status">
          <Check />
          {notice}
        </div>
      )}
      {cartOpen && (
        <Modal title="注文内容" onClose={() => setCartOpen(false)} drawer>
          <CartPanel onReview={startReview} />
        </Modal>
      )}
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)} wide>
          <div className="customize-stack">
            {isTemperatureProduct(selected.name) ? (
              <fieldset className="field-group">
                <legend>温度を選択</legend>
                <p className="muted">ホットまたはアイスを選択してください。</p>
                <div className="temperature-grid">
                  {(["hot", "iced"] as const).map((value) => (
                    <button
                      key={value}
                      aria-pressed={options.temperature === value}
                      className={options.temperature === value ? "selected" : ""}
                      onClick={() => setOptions({ temperature: value })}
                    >
                      {value === "hot" ? <Flame /> : <Snowflake />}
                      <span>{value === "hot" ? "ホット" : "アイス"}</span>
                      {options.temperature === value && <Check />}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : (
              <>
                <p className="muted">
                  2色とオプションを選択してください。同じ色も選べます。
                </p>
                {(["color1", "color2"] as const).map((key, index) => (
                  <fieldset className="field-group" key={key}>
                    <legend>{index + 1}色目</legend>
                    <div className="color-grid">
                      {cocktailColors.map((color) => (
                        <button
                          aria-pressed={options[key] === color}
                          className={`color-choice ${options[key] === color ? "selected" : ""}`}
                          key={color}
                          onClick={() =>
                            setOptions((current) => ({ ...current, [key]: color }))
                          }
                        >
                          <i className={`mini-color color-${color}`} />
                          <span>{colorLabels[color]}</span>
                          {options[key] === color && <Check />}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ))}
                <div className="binary-grid">
                  {(["carbonated", "aphrodisiac"] as const).map((key) => (
                    <fieldset className="field-group" key={key}>
                      <legend>{key === "carbonated" ? "炭酸" : "媚薬"}</legend>
                      <div className="segmented">
                        {[true, false].map((value) => (
                          <button
                            key={String(value)}
                            aria-pressed={options[key] === value}
                            className={options[key] === value ? "selected" : ""}
                            onClick={() =>
                              setOptions((current) => ({
                                ...current,
                                [key]: value,
                              }))
                            }
                          >
                            {value ? "あり" : "なし"}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </>
            )}
            <div className="cart-total">
              <span>注文数</span>
              <div className="quantity-stepper">
                <button
                  aria-label="注文数を1個減らす"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity(quantity - 1)}
                >
                  <Minus />
                </button>
                <output>{quantity}</output>
                <button
                  aria-label="注文数を1個増やす"
                  disabled={quantity >= 99}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus />
                </button>
              </div>
            </div>
            {errors.length > 0 && (
              <div className="error-list" role="alert">
                {errors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </div>
            )}
            <button className="primary-button full-width" onClick={configure}>
              <ShoppingBag />
              カートに追加
            </button>
          </div>
        </Modal>
      )}
      {review && (
        <Modal
          title="注文内容を確認"
          onClose={() => {
            if (!busy) setReview(false);
          }}
        >
          <div className="review-table">
            テーブル <b>{cart.table || "未選択"}</b>
          </div>
          <div className="review-items">
            {cart.items.map((item) => (
              <div key={item.id}>
                <div>
                  <strong>{formatProductName(item.product.name, item.options)}</strong>
                  <OptionSummary options={item.options} />
                </div>
                <b>×{item.quantity}</b>
              </div>
            ))}
          </div>
          <div className="cart-total">
            <span>合計</span>
            <b>{cart.quantity}点</b>
          </div>
          {!cart.table && (
            <p className="error-list">
              カートに戻って、テーブル番号を選択してください。
            </p>
          )}
          {errors.length > 0 && (
            <div className="error-list" role="alert">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}
          <div className="form-actions">
            <button
              className="secondary-button"
              disabled={busy}
              onClick={() => {
                setReview(false);
                setCartOpen(true);
              }}
            >
              戻る
            </button>
            <button
              className="primary-button"
              disabled={busy || !cart.quantity || !cart.table}
              onClick={() => void submit()}
            >
              {busy ? "送信中…" : "注文を送信"}
            </button>
          </div>
        </Modal>
      )}
      {receipt && (
        <Modal title="注文を受け付けました" onClose={() => setReceipt("")}>
          <div className="success-state">
            <Check />
            <p>受付番号</p>
            <h2>#{receipt}</h2>
            <p>テーブルまでお届けします。</p>
            <button className="primary-button" onClick={() => setReceipt("")}>
              注文を続ける
            </button>
            <Link to="/orders" onClick={() => setReceipt("")}>
              注文状況を見る
            </Link>
          </div>
        </Modal>
      )}
    </div>
  );
};

import {
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ProductForm } from "../components/ProductForm";
import { Modal } from "../components/Modal";
import { useData } from "../lib/data";
import {
  categoryLabels,
  productCategories,
  type Product,
  type ProductCategory,
} from "../types";
export const EditProductsPage = () => {
  const { products, profile, ready } = useData();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [notice, setNotice] = useState("");
  const creating = params.get("create") === "1";
  const normalize = (value: string) =>
    value.normalize("NFKC").toLocaleLowerCase("ja-JP").trim();
  const visible = products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      normalize(p.name).includes(normalize(search)),
  );
  const closeForm = () => {
    setEditing(null);
    setDuplicate(false);
    if (creating) setParams({}, { replace: true });
  };
  return (
    <div className="page products-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">CATALOG MANAGEMENT</span>
          <h1>商品管理</h1>
          <p>{products.length} Products · 全端末のメニューへ同期</p>
        </div>
        <button
          className="primary-button"
          disabled={!profile}
          onClick={() => {
            setNotice("");
            setParams({ create: "1" });
          }}
        >
          <Plus />
          商品を追加
        </button>
      </header>
      {!profile && (
        <p className="product-management-note">
          変更するには<Link to="/account">名前とアイコンを登録</Link>
          してください。
        </p>
      )}
      {notice && (
        <p className="product-feedback" role="status">
          {notice}
        </p>
      )}
      <div className="product-management-toolbar">
        <label className="search-box">
          <Search />
          <input
            aria-label="編集する商品を検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="商品を検索"
          />
        </label>
        <label className="sort-label">
          カテゴリー
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as ProductCategory | "all")
            }
          >
            <option value="all">すべて</option>
            {productCategories.map((value) => (
              <option key={value} value={value}>
                {categoryLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <span className="muted">{visible.length}件</span>
      </div>
      {!ready ? (
        <p role="status">商品を読み込んでいます…</p>
      ) : visible.length ? (
        <div className="product-table">
          <div className="product-table-head">
            <span>商品</span>
            <span>カテゴリー</span>
            <span>登録者</span>
            <span>更新日時</span>
            <span />
          </div>
          {visible.map((product) => (
            <article className="product-row" key={product.id}>
              <div className="product-identity">
                <img src={product.imageUrl} alt="" loading="lazy" />
                <div>
                  <h2>{product.name}</h2>
                  {!product.isAvailable && <small>非表示</small>}
                </div>
              </div>
              <span className="product-category-cell">
                {categoryLabels[product.category]}
              </span>
              <span className="product-author">{product.creatorName}</span>
              <time className="product-updated">
                {Number.isNaN(Date.parse(product.updatedAt))
                  ? "—"
                  : new Date(product.updatedAt).toLocaleDateString("ja-JP")}
              </time>
              <ProductActions
                product={product}
                disabled={!profile}
                onEdit={() => {
                  setEditing(product);
                  setDuplicate(false);
                }}
                onDuplicate={() => {
                  setEditing(product);
                  setDuplicate(true);
                }}
                onDelete={() => setDeleting(product)}
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>
            {products.length
              ? "検索に一致する商品がありません"
              : "登録商品はありません"}
          </h2>
          <button
            className="secondary-button"
            disabled={!profile}
            onClick={() => setParams({ create: "1" })}
          >
            商品を追加する
          </button>
        </div>
      )}
      <p className="product-management-note">
        編集・削除後も、受付済みの注文の写真・商品名・レシピは保持されます。
      </p>
      {(creating || editing) && profile && (
        <ProductForm
          key={editing?.id || "create"}
          product={editing || undefined}
          duplicate={duplicate}
          onClose={closeForm}
          onSaved={() => {
            setNotice(
              creating || duplicate
                ? "商品を登録しました。"
                : "商品を更新しました。",
            );
            closeForm();
          }}
        />
      )}
      {deleting && (
        <DeleteProductDialog
          product={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            setNotice("商品を削除しました。受付済みの注文は保持されています。");
          }}
        />
      )}
    </div>
  );
};
const ProductActions = ({
  product,
  disabled,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  product: Product;
  disabled: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        root.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div className="product-actions" ref={root}>
      <button
        className="icon-button"
        disabled={disabled}
        aria-label={`${product.name}の操作`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <MoreHorizontal />
      </button>
      {open && (
        <div className="action-menu">
          <button
            aria-label={`${product.name}を編集`}
            onClick={() => {
              root.current?.querySelector("button")?.focus();
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil />
            編集
          </button>
          <button
            onClick={() => {
              root.current?.querySelector("button")?.focus();
              setOpen(false);
              onDuplicate();
            }}
          >
            <Copy />
            複製
          </button>
          <button
            className="danger-text"
            aria-label={`${product.name}を削除`}
            onClick={() => {
              root.current?.querySelector("button")?.focus();
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 />
            削除
          </button>
        </div>
      )}
    </div>
  );
};
const DeleteProductDialog = ({
  product,
  onClose,
  onDeleted,
}: {
  product: Product;
  onClose: () => void;
  onDeleted: () => void;
}) => {
  const { deleteProduct } = useData();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await deleteProduct(product.id, product.updatedAt);
      onDeleted();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "削除に失敗しました。",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="商品を削除しますか？"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <h3>{product.name}</h3>
      <p>全端末のメニューから削除します。この操作は取り消せません。</p>
      <p className="muted">受付済みの注文とレシピは残ります。</p>
      {error && (
        <p className="error-list" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="secondary-button" disabled={busy} onClick={onClose}>
          キャンセル
        </button>
        <button
          className="danger-button"
          disabled={busy}
          onClick={() => void remove()}
        >
          {busy ? "削除中…" : "この商品を削除する"}
        </button>
      </div>
    </Modal>
  );
};

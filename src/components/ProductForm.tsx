import { useState, type FormEvent } from "react";
import { ImageField } from "./ImageField";
import { Modal } from "./Modal";
import { useData } from "../lib/data";
import { validateProduct } from "../lib/validation";
import {
  categoryLabels,
  productCategories,
  type Product,
  type ProductCategory,
} from "../types";
export const ProductForm = ({
  product,
  duplicate = false,
  onClose,
  onSaved,
}: {
  product?: Product;
  duplicate?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const { addProduct, updateProduct, duplicateProduct } = useData();
  const [name, setName] = useState(
    product
      ? duplicate
        ? product.name.slice(0, 54) + " のコピー"
        : product.name
      : "",
  );
  const [category, setCategory] = useState<ProductCategory>(
    product?.category || "original_cocktail",
  );
  const [recipe, setRecipe] = useState(
    product?.category === "original_cocktail" ? product.recipe : "",
  );
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const next = validateProduct(
      category,
      name,
      image,
      recipe,
      product?.imageUrl,
    );
    setErrors(next);
    if (next.length) return;
    setBusy(true);
    try {
      const draft = { name, category, recipe, image };
      if (product && duplicate)
        await duplicateProduct(product.id, draft, product.updatedAt);
      else if (product)
        await updateProduct(product.id, draft, product.updatedAt);
      else await addProduct({ ...draft, image: image! });
      onSaved();
    } catch (reason) {
      setErrors([
        reason instanceof Error ? reason.message : "保存できませんでした。",
      ]);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={duplicate ? "商品を複製" : product ? "商品を編集" : "商品を追加"}
      onClose={() => {
        if (!busy) onClose();
      }}
      drawer
    >
      <form className="product-editor" onSubmit={(e) => void submit(e)}>
        <fieldset disabled={busy} className="product-editor-fields">
          <label className="field">
            <span>カテゴリー</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
            >
              {productCategories.map((value) => (
                <option key={value} value={value}>
                  {categoryLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>
              商品名 <b>必須</b>
            </span>
            <input
              autoComplete="off"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder="商品名を入力"
            />
          </label>
          <div className="field">
            <span>商品画像 {!product && <b>必須</b>}</span>
            <ImageField
              file={image}
              onChange={setImage}
              existingImageUrl={product?.imageUrl}
            />
            {product && <small>選び直さなければ現在の画像を使います。</small>}
            {image && product && (
              <button
                type="button"
                className="text-button"
                onClick={() => setImage(null)}
              >
                元の画像に戻す
              </button>
            )}
          </div>
          {category === "original_cocktail" && (
            <label className="field">
              <span>
                レシピ <b>必須</b>
              </span>
              <textarea
                value={recipe}
                rows={8}
                maxLength={2000}
                onChange={(e) => setRecipe(e.target.value)}
                placeholder="材料・分量・作り方"
              />
              <small>{recipe.length}/2000文字・注文管理でのみ表示</small>
            </label>
          )}
        </fieldset>
        {errors.length > 0 && (
          <div className="error-list" role="alert">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={busy}
            onClick={onClose}
          >
            キャンセル
          </button>
          <button className="primary-button" type="submit" disabled={busy}>
            {busy
              ? "保存中…"
              : product && !duplicate
                ? "変更を保存する"
                : "商品を登録"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

import { Coffee, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { categoryLabels, type Product } from "../types";
import { isTemperatureProduct } from "../lib/order-options";

export type ProductViewMode = "compact" | "image";

export const OrderProductCard = ({
  product,
  mode,
  onChoose,
}: {
  product: Product;
  mode: ProductViewMode;
  onChoose: (product: Product) => void;
}) => {
  const [failedImage, setFailedImage] = useState("");
  const [pressed, setPressed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const temperature = isTemperatureProduct(product.name);
  const optional = temperature || product.category === "normal_cocktail";
  const choose = () => {
    clearTimeout(timer.current);
    setPressed(true);
    timer.current = setTimeout(() => setPressed(false), 180);
    onChoose(product);
  };
  return (
    <button
      className={`pos-product-card ${mode === "compact" ? "compact-product-card" : "visual-product-card"} ${pressed ? "product-pressed" : ""}`}
      onClick={choose}
      aria-label={`${product.name}${temperature ? "の温度を選択" : optional ? "をカスタマイズ" : "をカートに追加"}`}
    >
      {mode === "image" && (
        <div className="pos-product-image">
          {product.imageUrl && failedImage !== product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setFailedImage(product.imageUrl)}
            />
          ) : (
            <span className="product-image-placeholder" aria-label="商品画像なし">
              <Coffee />
            </span>
          )}
        </div>
      )}
      <div className="pos-product-copy">
        <strong>{product.name}</strong>
        <small>{categoryLabels[product.category]}</small>
        {optional && <span>{temperature ? "ホット / アイス" : "オプションを選択"}</span>}
      </div>
      <span className="product-add-icon" aria-hidden="true">
        <Plus />
      </span>
    </button>
  );
};

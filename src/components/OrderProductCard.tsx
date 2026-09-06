import { Coffee, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { categoryLabels, type Product } from "../types";

export const OrderProductCard = ({
  product,
  onChoose,
}: {
  product: Product;
  onChoose: (product: Product) => void;
}) => {
  const [failedImage, setFailedImage] = useState("");
  const [pressed, setPressed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const optional = product.category === "normal_cocktail";
  const choose = () => {
    clearTimeout(timer.current);
    setPressed(true);
    timer.current = setTimeout(() => setPressed(false), 180);
    onChoose(product);
  };
  return (
    <button
      className={`pos-product-card visual-product-card ${pressed ? "product-pressed" : ""}`}
      onClick={choose}
      aria-label={`${product.name}${optional ? "をカスタマイズ" : "をカートに追加"}`}
    >
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
      <div className="pos-product-copy">
        <strong>{product.name}</strong>
        <small>{categoryLabels[product.category]}</small>
        {optional && <span>オプションを選択</span>}
      </div>
      <span className="product-add-icon" aria-hidden="true">
        <Plus />
      </span>
    </button>
  );
};

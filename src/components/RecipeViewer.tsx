import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

import type { OriginalCocktailOrder } from '../types';
import { Modal } from './Modal';

export const RecipeViewer = ({ order, onClose }: { order: OriginalCocktailOrder; onClose: () => void }) => {
  const [fontSize, setFontSize] = useState(28);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  return <Modal title={`${order.productName}のレシピ`} onClose={onClose} fullScreen>
    <div className="recipe-reader">
      <div className="recipe-reader-toolbar">
        <p>TABLE {order.tableNumber} <span>／ 受付番号 #{order.receiptNumber}</span></p>
        <div className="recipe-font-controls" role="group" aria-label="レシピの文字サイズ">
          <button type="button" aria-label="レシピの文字を小さく" disabled={fontSize <= 20} onClick={() => setFontSize((size) => size - 2)}><Minus /></button>
          <output aria-live="polite">文字 {fontSize}px</output>
          <button type="button" aria-label="レシピの文字を大きく" disabled={fontSize >= 40} onClick={() => setFontSize((size) => size + 2)}><Plus /></button>
        </div>
      </div>
      <div className="recipe-reader-body">
        <figure className="recipe-reference">
          <div className="recipe-reference-image">
            {order.productImageUrl && failedImage !== order.productImageUrl
              ? <img src={order.productImageUrl} alt={`${order.productName}の完成品`} onError={() => setFailedImage(order.productImageUrl)} />
              : <p>完成品の写真を表示できません。</p>}
          </div>
          <figcaption>完成品の参考写真</figcaption>
        </figure>
        <div className="recipe-reader-paper" role="region" aria-label="レシピ本文" tabIndex={0}>
          <p style={{ fontSize }}>{order.recipe || 'レシピが登録されていません。'}</p>
        </div>
      </div>
    </div>
  </Modal>;
};

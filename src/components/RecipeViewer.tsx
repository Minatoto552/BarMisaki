import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';

import type { OriginalCocktailOrder } from '../types';
import { Modal } from './Modal';

export const RecipeViewer = ({ order, onClose }: { order: OriginalCocktailOrder; onClose: () => void }) => {
  const [fontSize, setFontSize] = useState(28);
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
      <div className="recipe-reader-paper" role="region" aria-label="レシピ本文" tabIndex={0}>
        <p style={{ fontSize }}>{order.recipe || 'レシピが登録されていません。'}</p>
      </div>
    </div>
  </Modal>;
};

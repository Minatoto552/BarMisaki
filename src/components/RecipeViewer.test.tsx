import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { OriginalCocktailOrder } from '../types';
import { RecipeViewer } from './RecipeViewer';

const order: OriginalCocktailOrder = {
  id: 'order', cartId: 'cart', receiptNumber: '12345', tableNumber: '8',
  productId: 'product', productName: '星空', productImageUrl: '/image.png', category: 'original_cocktail',
  recipe: 'シロップ 20ml\nソーダ 100ml\nゆっくり混ぜる', orderedBy: 'user', ordererName: 'テスト',
  status: 'pending', createdAt: '2026-08-28T12:00:00Z', updatedAt: '2026-08-28T12:00:00Z',
};

afterEach(cleanup);
describe('RecipeViewer', () => {
  it('注文時の完成品写真をレシピと同時に表示する', () => {
    render(<RecipeViewer order={order} onClose={vi.fn()} />);
    expect(screen.getByRole('img', { name: '星空の完成品' })).toHaveAttribute('src', order.productImageUrl);
    expect(screen.getByText('完成品の参考写真')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'レシピ本文' }).textContent).toBe(order.recipe);
  });

  it('写真が読み込めなくてもレシピを表示し続ける', () => {
    render(<RecipeViewer order={order} onClose={vi.fn()} />);
    fireEvent.error(screen.getByRole('img', { name: '星空の完成品' }));
    expect(screen.getByText('完成品の写真を表示できません。')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'レシピ本文' }).textContent).toBe(order.recipe);
  });

  it('全画面ダイアログに注文時のレシピを大きく表示する', () => {
    render(<RecipeViewer order={order} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toHaveClass('modal-fullscreen');
    expect(screen.getByRole('region', { name: 'レシピ本文' }).querySelector('p')).toHaveStyle({ fontSize: '28px' });
    expect(screen.getByRole('region').textContent).toBe(order.recipe);
    expect(screen.getByText(/TABLE 8/)).toBeInTheDocument();
  });

  it('20〜40pxの範囲で文字を拡大・縮小できる', () => {
    render(<RecipeViewer order={order} onClose={vi.fn()} />);
    const larger = screen.getByRole('button', { name: 'レシピの文字を大きく' });
    const smaller = screen.getByRole('button', { name: 'レシピの文字を小さく' });
    for (let i = 0; i < 10; i++) fireEvent.click(larger);
    expect(larger).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('40px');
    for (let i = 0; i < 15; i++) fireEvent.click(smaller);
    expect(smaller).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('20px');
  });

  it('閉じるボタンとEscapeで閉じる', () => {
    const onClose = vi.fn();
    render(<RecipeViewer order={order} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

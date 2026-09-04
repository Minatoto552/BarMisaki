import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '../types';
import { EditProductsPage } from './EditProductsPage';

const state = vi.hoisted(() => ({
  products: [] as Product[], profile: { displayName: 'テスト' } as { displayName: string } | null,
  updateProduct: vi.fn(), deleteProduct: vi.fn(),
}));
vi.mock('../lib/data', () => ({ useData: () => ({ ...state, ready: true }) }));
const product: Product = {
  id: 'original', name: '星空', category: 'original_cocktail', recipe: 'ソーダ 100ml', imageUrl: '/drink.png',
  createdBy: 'creator', creatorName: '登録者', isAvailable: true, createdAt: 'created', updatedAt: 'revision',
};
const open = () => render(<MemoryRouter><EditProductsPage /></MemoryRouter>);
const action = (label: string) => {
  fireEvent.click(screen.getByRole('button', { name: '星空の操作' }));
  fireEvent.click(screen.getByRole('button', { name: label }));
};
beforeEach(() => {
  vi.resetAllMocks(); state.products = [product]; state.profile = { displayName: 'テスト' };
});
afterEach(cleanup);

describe('商品編集', () => {
  it('画像を選び直さず名前とレシピを保存する', async () => {
    open(); action('星空を編集');
    fireEvent.change(screen.getByLabelText(/商品名/), { target: { value: '星空ソーダ' } });
    fireEvent.change(screen.getByLabelText(/レシピ/), { target: { value: 'シロップ 20ml\nソーダ 100ml' } });
    fireEvent.click(screen.getByRole('button', { name: '変更を保存する' }));
    await waitFor(() => expect(state.updateProduct).toHaveBeenCalledWith('original', {
      name: '星空ソーダ', category: 'original_cocktail', recipe: 'シロップ 20ml\nソーダ 100ml', image: null,
    }, 'revision'));
    expect(await screen.findByRole('status')).toHaveTextContent('商品を更新しました');
  });
  it('必須入力の不足を拒否し、キャンセルでは保存しない', () => {
    open(); action('星空を編集');
    fireEvent.change(screen.getByLabelText(/レシピ/), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '変更を保存する' }));
    expect(screen.getByRole('alert')).toHaveTextContent('レシピを入力');
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(state.updateProduct).not.toHaveBeenCalled();
  });
  it('ジュースへカテゴリーを変えるとレシピ欄を表示しない', async () => {
    open(); action('星空を編集');
    fireEvent.change(within(screen.getByRole('dialog')).getByLabelText('カテゴリー'), { target: { value: 'juice' } });
    expect(screen.queryByLabelText(/レシピ/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '変更を保存する' }));
    await waitFor(() => expect(state.updateProduct).toHaveBeenCalledWith('original', expect.objectContaining({ category: 'juice' }), 'revision'));
  });
  it('削除の確認でキャンセルでき、明示的な確定後だけ削除する', async () => {
    open(); action('星空を削除');
    expect(state.deleteProduct).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(state.deleteProduct).not.toHaveBeenCalled();
    action('星空を削除');
    fireEvent.click(screen.getByRole('button', { name: 'この商品を削除する' }));
    await waitFor(() => expect(state.deleteProduct).toHaveBeenCalledWith('original', 'revision'));
    expect(await screen.findByRole('status')).toHaveTextContent('受付済みの注文は保持');
  });
  it('保存エラーを表示し、編集内容を保持する', async () => {
    state.updateProduct.mockRejectedValue(new Error('通信に失敗しました'));
    open(); action('星空を編集');
    fireEvent.click(screen.getByRole('button', { name: '変更を保存する' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('通信に失敗しました');
    expect(screen.getByLabelText(/商品名/)).toHaveValue('星空');
  });
  it('未登録ユーザーの変更を禁止し、商品検索できる', () => {
    state.profile = null;
    open(); expect(screen.getByRole('button', { name: '星空の操作' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '商品を追加' })).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: '編集する商品を検索' }), { target: { value: '該当なし' } });
    expect(screen.getByText('検索に一致する商品がありません')).toBeInTheDocument();
  });
});

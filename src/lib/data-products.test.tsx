import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DataProvider, useData } from './data';
import type { Product } from '../types';

const mocks = vi.hoisted(() => ({ services: vi.fn() }));
vi.mock('./firebase', () => ({ runtimeMode: 'sample', getFirebaseServices: mocks.services }));

const product: Product = {
  id: 'drink', name: '星空', category: 'original_cocktail', recipe: '旧レシピ', imageUrl: '/drink.png',
  createdBy: 'original-creator', creatorName: '登録者', isAvailable: true, createdAt: 'created', updatedAt: 'revision-1',
};
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  localStorage.setItem('vrc-order-profile', JSON.stringify({ id: 'user', displayName: 'テスト' }));
  localStorage.setItem('vrc-order-products', JSON.stringify([product]));
  localStorage.setItem('vrc-order-orders', JSON.stringify([{ id: 'existing-order', productName: product.name, recipe: product.recipe }]));
  mocks.services.mockResolvedValue({ db: null, firestoreApi: null });
});
afterEach(() => { cleanup(); localStorage.clear(); });

describe('商品データの更新・削除', () => {
  it('画像と登録者を維持し、別カテゴリーへ変更したらレシピを除く', async () => {
    const { result } = renderHook(useData, { wrapper: DataProvider });
    await act(() => result.current.updateProduct('drink', { name: ' 新しいジュース ', category: 'juice', recipe: '旧レシピ', image: null }, 'revision-1'));
    expect(result.current.products[0]).toMatchObject({ name: '新しいジュース', category: 'juice', imageUrl: product.imageUrl, createdBy: product.createdBy, createdAt: product.createdAt });
    expect(result.current.products[0]).not.toHaveProperty('recipe');
    expect(result.current.orders[0]).toMatchObject({ recipe: '旧レシピ' });
  });
  it('削除は商品だけが対象で、注文のスナップショットは残る', async () => {
    const { result } = renderHook(useData, { wrapper: DataProvider });
    await act(() => result.current.deleteProduct('drink', 'revision-1'));
    expect(result.current.products).toEqual([]);
    expect(result.current.orders).toHaveLength(1);
    expect(result.current.orders[0]).toMatchObject({ productName: '星空', recipe: '旧レシピ' });
  });
  it('削除済み・他端末で変更された商品への保存は拒否する', async () => {
    const { result } = renderHook(useData, { wrapper: DataProvider });
    await expect(result.current.updateProduct('drink', { name: '上書き', category: 'juice', recipe: '', image: null }, 'older-revision')).rejects.toThrow('他の端末');
    await expect(result.current.updateProduct('missing', { name: '上書き', category: 'juice', recipe: '', image: null }, 'revision-1')).rejects.toThrow('すでに削除');
  });
  it('未登録ユーザーの更新と削除を拒否する', async () => {
    localStorage.removeItem('vrc-order-profile');
    const { result } = renderHook(useData, { wrapper: DataProvider });
    await expect(result.current.deleteProduct('drink', 'revision-1')).rejects.toThrow('アカウント');
    await expect(result.current.updateProduct('drink', { name: '星空', category: 'juice', recipe: '', image: null }, 'revision-1')).rejects.toThrow('アカウント');
  });
  it('Firebaseではトランザクションで編集項目だけを更新する', async () => {
    const update = vi.fn();
    const transaction = { get: vi.fn().mockResolvedValue({ exists: () => true, data: () => product }), update };
    const deleteField = { sentinel: 'delete' };
    mocks.services.mockResolvedValue({ db: {}, firestoreApi: {
      doc: () => 'product-ref', deleteField: () => deleteField,
      runTransaction: (_db: unknown, callback: (value: typeof transaction) => Promise<void>) => callback(transaction),
    } });
    const { result } = renderHook(useData, { wrapper: DataProvider });
    await act(() => result.current.updateProduct('drink', { name: 'ジュース', category: 'juice', image: null, recipe: '' }, 'revision-1'));
    expect(update).toHaveBeenCalledWith('product-ref', { name: 'ジュース', category: 'juice', recipe: deleteField, updatedAt: expect.any(String) });
  });
  it('Firebase上の新しい版を古いフォームから削除しない', async () => {
    const remove = vi.fn();
    const transaction = { get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ ...product, updatedAt: 'newer' }) }), delete: remove };
    mocks.services.mockResolvedValue({ db: {}, firestoreApi: {
      doc: () => 'product-ref',
      runTransaction: (_db: unknown, callback: (value: typeof transaction) => Promise<void>) => callback(transaction),
    } });
    const { result } = renderHook(useData, { wrapper: DataProvider });
    await expect(result.current.deleteProduct('drink', 'revision-1')).rejects.toThrow('他の端末');
    expect(remove).not.toHaveBeenCalled();
  });
});

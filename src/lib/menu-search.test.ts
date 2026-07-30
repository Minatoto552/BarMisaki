import { describe, expect, it } from 'vitest';

import type { Product } from '../types';
import { filterMenuProducts } from './menu-search';

const products: Product[] = [
  { id: 'normal', category: 'normal_cocktail', name: 'カラーツイン', imageUrl: '', createdBy: '', creatorName: '', isAvailable: true, createdAt: '', updatedAt: '' },
  { id: 'original', category: 'original_cocktail', name: '月灯りのクリームソーダ', recipe: '', imageUrl: '', createdBy: '', creatorName: '', isAvailable: true, createdAt: '', updatedAt: '' },
  { id: 'juice', category: 'juice', name: 'ＡＰＰＬＥ　ＪＵＩＣＥ', imageUrl: '', createdBy: '', creatorName: '', isAvailable: true, createdAt: '', updatedAt: '' },
];

describe('filterMenuProducts', () => {
  it('未入力時は選択中カテゴリーだけを表示する', () => {
    expect(filterMenuProducts(products, 'normal_cocktail', '')).toEqual([products[0]]);
  });

  it('入力時は全カテゴリーから検索する', () => {
    expect(filterMenuProducts(products, 'normal_cocktail', '月灯り')).toEqual([products[1]]);
  });

  it('全角半角と大文字小文字を正規化する', () => {
    expect(filterMenuProducts(products, 'food', 'apple juice')).toEqual([products[2]]);
  });
});

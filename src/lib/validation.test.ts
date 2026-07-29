import { describe, expect, it } from 'vitest';

import { validateDisplayName, validateOrderOptions, validateProduct, validateTableNumber } from './validation';

const image = new File(['image'], 'drink.png', { type: 'image/png' });

describe('注文オプション', () => {
  it('赤＋赤のように同じ色を2回選べる', () => {
    expect(validateOrderOptions('normal_cocktail', {
      color1: 'red', color2: 'red', carbonated: true, aphrodisiac: false,
    })).toEqual([]);
  });

  it('異なる2色を選べる', () => {
    expect(validateOrderOptions('normal_cocktail', {
      color1: 'blue', color2: 'white', carbonated: false, aphrodisiac: true,
    })).toEqual([]);
  });

  it('色や二択が未選択なら注文できない', () => {
    expect(validateOrderOptions('normal_cocktail', {})).toHaveLength(4);
  });

  it('フードにカクテル設定を要求しない', () => {
    expect(validateOrderOptions('food', {})).toEqual([]);
  });
});

describe('商品登録', () => {
  it('商品名と画像を必須にする', () => {
    expect(validateProduct('food', '', null, '')).toHaveLength(2);
  });

  it('オリジナルカクテルだけレシピを必須にする', () => {
    expect(validateProduct('original_cocktail', '星空', image, '')).toContain('オリジナルカクテルのレシピを入力してください。');
    expect(validateProduct('food', 'サンド', image, '')).toEqual([]);
    expect(validateProduct('juice', 'オレンジジュース', image, '')).toEqual([]);
  });
});

describe('アカウント', () => {
  it('空の名前と33文字以上を拒否する', () => {
    expect(validateDisplayName('')).toBeTruthy();
    expect(validateDisplayName('あ'.repeat(33))).toBeTruthy();
    expect(validateDisplayName('VRChat User')).toBeNull();
  });
});

describe('テーブル番号', () => {
  it('注文時に必須とし、1〜8だけを許可する', () => {
    expect(validateTableNumber('')).toBeTruthy();
    expect(validateTableNumber('1')).toBeNull();
    expect(validateTableNumber('8')).toBeNull();
    expect(validateTableNumber('9')).toBeTruthy();
    expect(validateTableNumber('A-1')).toBeTruthy();
  });
});

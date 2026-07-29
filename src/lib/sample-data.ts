import type { NormalCocktailProduct, Product } from '../types';
import { assetPath } from './assets';

const now = new Date().toISOString();

export const builtInNormalCocktail: NormalCocktailProduct = {
  id: 'sample-normal', category: 'normal_cocktail', name: 'カラーツイン',
  imageUrl: assetPath('normal-cocktail.svg'), createdBy: 'sample', creatorName: 'BarMisaki',
  isAvailable: true, createdAt: now, updatedAt: now,
};

export const sampleProducts: Product[] = [
  builtInNormalCocktail,
  {
    id: 'sample-original', category: 'original_cocktail', name: '月灯りのクリームソーダ',
    imageUrl: assetPath('original-cocktail.svg'), recipe: 'ブルーシロップ 20ml\nソーダ 100ml\nバニラアイスと星形シュガーを添える',
    createdBy: 'sample', creatorName: 'Mina', isAvailable: true, createdAt: now, updatedAt: now,
  },
  {
    id: 'sample-food', category: 'food', name: '森のクロワッサンサンド',
    imageUrl: assetPath('food.svg'), createdBy: 'sample', creatorName: 'Cafe Staff',
    isAvailable: true, createdAt: now, updatedAt: now,
  },
];

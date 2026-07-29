import type { Product } from '../types';

const now = new Date().toISOString();

export const sampleProducts: Product[] = [
  {
    id: 'sample-normal', category: 'normal_cocktail', name: 'カラーツイン',
    imageUrl: '/normal-cocktail.svg', createdBy: 'sample', creatorName: 'Cafe Staff',
    isAvailable: true, createdAt: now, updatedAt: now,
  },
  {
    id: 'sample-original', category: 'original_cocktail', name: '月灯りのクリームソーダ',
    imageUrl: '/original-cocktail.svg', recipe: 'ブルーシロップ 20ml\nソーダ 100ml\nバニラアイスと星形シュガーを添える',
    createdBy: 'sample', creatorName: 'Mina', isAvailable: true, createdAt: now, updatedAt: now,
  },
  {
    id: 'sample-food', category: 'food', name: '森のクロワッサンサンド',
    imageUrl: '/food.svg', createdBy: 'sample', creatorName: 'Cafe Staff',
    isAvailable: true, createdAt: now, updatedAt: now,
  },
];

import type { CocktailColor, OrderOptions, ProductCategory } from '../types';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const validateDisplayName = (value: string): string | null => {
  const length = [...value.trim()].length;
  if (length === 0) return '名前を入力してください。';
  if (length > 32) return '名前は32文字以内で入力してください。';
  return null;
};

export const validateImage = (file: File | null): string | null => {
  if (!file) return '画像を選択してください。';
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'JPEG、PNG、WebP、GIF画像を選択してください。';
  if (file.size > MAX_IMAGE_BYTES) return '画像は5MB以下にしてください。';
  return null;
};

export const validateProduct = (
  category: ProductCategory,
  name: string,
  image: File | null,
  recipe: string,
): string[] => {
  const errors: string[] = [];
  const nameLength = [...name.trim()].length;
  if (nameLength === 0) errors.push('商品名を入力してください。');
  if (nameLength > 60) errors.push('商品名は60文字以内で入力してください。');
  const imageError = validateImage(image);
  if (imageError) errors.push(imageError);
  if (category === 'original_cocktail') {
    const recipeLength = [...recipe.trim()].length;
    if (recipeLength === 0) errors.push('オリジナルカクテルのレシピを入力してください。');
    if (recipeLength > 2000) errors.push('レシピは2000文字以内で入力してください。');
  }
  return errors;
};

export const validateOrderOptions = (category: ProductCategory, options: OrderOptions): string[] => {
  if (category !== 'normal_cocktail') return [];
  const colors = new Set<CocktailColor>(['red', 'blue', 'green', 'white', 'black']);
  const errors: string[] = [];
  if (!options.color1 || !colors.has(options.color1)) errors.push('1色目を選択してください。');
  if (!options.color2 || !colors.has(options.color2)) errors.push('2色目を選択してください。');
  if (typeof options.carbonated !== 'boolean') errors.push('炭酸のあり・なしを選択してください。');
  if (typeof options.aphrodisiac !== 'boolean') errors.push('媚薬のあり・なしを選択してください。');
  return errors;
};

export const validateTableNumber = (value: string): string | null => {
  const normalized = value.trim();
  if (!normalized) return 'テーブル番号を選択してください。';
  if (!/^[1-8]$/.test(normalized)) return 'テーブル番号は1〜8から選択してください。';
  return null;
};

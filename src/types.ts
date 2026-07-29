export const productCategories = ['normal_cocktail', 'original_cocktail', 'juice', 'food'] as const;
export const cocktailColors = ['red', 'blue', 'green', 'white', 'black'] as const;
export const orderStatuses = ['pending', 'preparing', 'completed'] as const;
export const emergencyKinds = ['help', 'medical', 'trouble', 'other'] as const;

export type ProductCategory = (typeof productCategories)[number];
export type CocktailColor = (typeof cocktailColors)[number];
export type OrderStatus = (typeof orderStatuses)[number];
export type EmergencyKind = (typeof emergencyKinds)[number];
export type EmergencyStatus = 'active' | 'acknowledged' | 'resolved';

export interface UserProfile {
  id: string;
  displayName: string;
  iconUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductBase {
  id: string;
  name: string;
  imageUrl: string;
  createdBy: string;
  creatorName: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NormalCocktailProduct extends ProductBase {
  category: 'normal_cocktail';
}

export interface OriginalCocktailProduct extends ProductBase {
  category: 'original_cocktail';
  recipe: string;
}

export interface FoodProduct extends ProductBase {
  category: 'food';
}

export interface JuiceProduct extends ProductBase {
  category: 'juice';
}

export type Product = NormalCocktailProduct | OriginalCocktailProduct | JuiceProduct | FoodProduct;

interface OrderBase {
  id: string;
  receiptNumber: string;
  cartId: string;
  tableNumber: string;
  productId: string;
  productName: string;
  productImageUrl: string;
  orderedBy: string;
  ordererName: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NormalCocktailOrder extends OrderBase {
  category: 'normal_cocktail';
  color1: CocktailColor;
  color2: CocktailColor;
  carbonated: boolean;
  aphrodisiac: boolean;
}

export interface OriginalCocktailOrder extends OrderBase {
  category: 'original_cocktail';
  recipe: string;
}

export interface FoodOrder extends OrderBase {
  category: 'food';
}

export interface JuiceOrder extends OrderBase {
  category: 'juice';
}

export type Order = NormalCocktailOrder | OriginalCocktailOrder | JuiceOrder | FoodOrder;

export interface Emergency {
  id: string;
  kind: EmergencyKind;
  message: string;
  createdBy: string;
  creatorName: string;
  creatorIconUrl: string;
  status: EmergencyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderOptions {
  color1?: CocktailColor;
  color2?: CocktailColor;
  carbonated?: boolean;
  aphrodisiac?: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  options: OrderOptions;
}

export const categoryLabels: Record<ProductCategory, string> = {
  normal_cocktail: 'ノーマルカクテル',
  original_cocktail: 'オリジナルカクテル',
  juice: 'ジュース',
  food: 'フード',
};

export const colorLabels: Record<CocktailColor, string> = {
  red: '赤',
  blue: '青',
  green: '緑',
  white: '白',
  black: '黒',
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: '未対応',
  preparing: '対応中',
  completed: '完了',
};

export const emergencyKindLabels: Record<EmergencyKind, string> = {
  help: 'スタッフを呼ぶ',
  medical: '体調不良',
  trouble: 'トラブル',
  other: 'その他',
};

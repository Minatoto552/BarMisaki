import { categoryLabels, type Product, type ProductCategory } from '../types';

const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase('ja-JP').replace(/\s+/g, ' ').trim();

export const filterMenuProducts = (products: Product[], category: ProductCategory, search: string) => {
  const query = normalize(search);
  return products.filter((product) => {
    if (!product.isAvailable) return false;
    if (!query) return product.category === category;
    return normalize(`${product.name} ${categoryLabels[product.category]}`).includes(query);
  });
};

import {
  drinkTemperatureLabels,
  type DrinkTemperature,
  type OrderOptions,
} from '../types';

const temperatureProductNames = new Set(['抹茶ラテ', 'いちごみるく']);

const normalizeProductName = (name: string) => name.trim().normalize('NFKC');

export const isTemperatureProduct = (name: string) =>
  temperatureProductNames.has(normalizeProductName(name));

export const isDrinkTemperature = (
  value: OrderOptions['temperature'],
): value is DrinkTemperature => value === 'hot' || value === 'iced';

export const formatProductName = (name: string, options: OrderOptions) =>
  isDrinkTemperature(options.temperature)
    ? `${name}（${drinkTemperatureLabels[options.temperature]}）`
    : name;

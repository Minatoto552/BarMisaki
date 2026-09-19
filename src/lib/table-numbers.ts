export const TABLE_NUMBERS = Array.from({ length: 8 }, (_, index) => String(index + 1));

const tableNumberSet = new Set(TABLE_NUMBERS);

export const isTableNumber = (value: string): boolean => tableNumberSet.has(value);

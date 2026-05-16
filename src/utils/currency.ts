export type Currency = 'KZT' | 'UZS' | 'USD' | 'AED';

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'KZT', label: 'KZT — Казахстанский тенге', symbol: '₸' },
  { value: 'UZS', label: "UZS — Узбекский сум",       symbol: "so'm" },
  { value: 'USD', label: 'USD — Доллар США',           symbol: '$' },
  { value: 'AED', label: 'AED — Дирхам ОАЭ',          symbol: 'AED' },
];

export function getCurrencySymbol(currency: string | null | undefined): string {
  return CURRENCIES.find(c => c.value === currency)?.symbol ?? '₸';
}

export function formatPrice(
  price: string | number | null | undefined,
  currency: string | null | undefined,
): string {
  if (price === null || price === undefined || price === '') return '';
  const num = Number(price).toLocaleString('ru-RU');
  const symbol = getCurrencySymbol(currency);
  return symbol === '$' ? `$${num}` : `${num} ${symbol}`;
}

export type CurrencyCode = 'USD' | 'EUR' | 'ZAR';

export const currencies = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', locale: 'en-ZA' },
} as const;

export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'USD'): string {
  return new Intl.NumberFormat(currencies[currencyCode].locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactCurrency(amount: number, currencyCode: CurrencyCode = 'USD'): string {
  const symbol = currencies[currencyCode].symbol;
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  return `${symbol}${amount.toFixed(2)}`;
}

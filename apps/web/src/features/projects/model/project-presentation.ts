export function formatProjectPrice(
  value: string | number,
  currency: string,
  locale: string,
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatProjectDate(value: string | null, locale: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
  }).format(date);
}

export function isStockCurrent(value: string | null, now = Date.now()) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  const age = now - timestamp;
  return Number.isFinite(timestamp) && age >= 0 && age <= 48 * 60 * 60 * 1000;
}

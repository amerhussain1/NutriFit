import type { CurrencyCode } from '../types';

export function currencySymbol(code: CurrencyCode): string {
  return code === 'PKR' ? 'Rs' : '₹';
}

export function formatMoney(amount: number, code: CurrencyCode): string {
  const rounded = Math.round(amount * 10) / 10;
  return `${currencySymbol(code)} ${rounded.toLocaleString()}`;
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatShortDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function toDateKey(value: string | Date = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

export function addDays(value: string | Date, days: number): Date {
  const date = typeof value === 'string' ? new Date(value) : new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

export function startOfWeek(value: string | Date = new Date()): Date {
  const date = typeof value === 'string' ? new Date(value) : new Date(value);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function titleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

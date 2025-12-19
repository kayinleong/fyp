import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = "MYR"
): string {
  // For MYR, use custom format with RM prefix
  if (currency === "MYR" || !currency) {
    return `RM ${amount.toLocaleString()}`;
  }
  // For other currencies, use Intl formatter
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date with options
 */
export function formatDate(
  date: Date | number,
  options: Intl.DateTimeFormatOptions = {}
) {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  return new Intl.DateTimeFormat("en-US", defaultOptions).format(date);
}

/**
 * Normalize various currency representations to ISO-style codes used in the app.
 * Examples: 'RM' -> 'MYR', 'myr' -> 'MYR', '$' -> 'USD' (if ambiguous, leave as-is)
 */
export function normalizeCurrency(input?: string | null): string | undefined {
  if (!input) return undefined;
  const raw = input.trim();
  if (raw === "") return undefined;

  const upper = raw.toUpperCase();

  // Common aliases
  const map: Record<string, string> = {
    RM: "MYR",
    MYR: "MYR",
    USD: "USD",
    EUR: "EUR",
    GBP: "GBP",
    SGD: "SGD",
    AUD: "AUD",
    CAD: "CAD",
    CNY: "CNY",
    JPY: "JPY",
    INR: "INR",
  };

  // Remove common currency punctuation and whitespace
  const cleaned = upper.replace(/[^A-Z0-9]/g, "");

  if (map[cleaned]) return map[cleaned];

  // Fallback: if cleaned is 3 letters, return as-is
  if (/^[A-Z]{3}$/.test(cleaned)) return cleaned;

  return undefined;
}

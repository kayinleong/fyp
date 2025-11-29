import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string) {
  if (!currency) {
    return new Intl.NumberFormat("en-US").format(amount);
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is invalid
    return `${new Intl.NumberFormat("en-US").format(amount)} ${currency}`;
  }
}

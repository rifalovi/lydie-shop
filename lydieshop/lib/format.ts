export const formatEUR = (amount: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Fusion intelligente des classes Tailwind : clsx pour la composition +
// tailwind-merge pour déduper les conflits (ex: "px-4 px-6" → "px-6").
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// Alias historique conservé pour compatibilité avec les imports existants.
export const cx = cn;

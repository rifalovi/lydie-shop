"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "./types";

type CartState = {
  lines: CartLine[];
  add: (line: CartLine) => void;
  remove: (productId: string, variantId?: string) => void;
  setQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clear: () => void;
  subtotal: () => number;
  count: () => number;
};

const sameLine = (a: CartLine, productId: string, variantId?: string) =>
  a.productId === productId && (a.variantId ?? null) === (variantId ?? null);

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (line) =>
        set((state) => {
          const existing = state.lines.find((l) =>
            sameLine(l, line.productId, line.variantId),
          );
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                sameLine(l, line.productId, line.variantId)
                  ? { ...l, quantity: l.quantity + line.quantity }
                  : l,
              ),
            };
          }
          return { lines: [...state.lines, line] };
        }),
      remove: (productId, variantId) =>
        set((state) => ({
          lines: state.lines.filter((l) => !sameLine(l, productId, variantId)),
        })),
      setQuantity: (productId, quantity, variantId) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            sameLine(l, productId, variantId)
              ? { ...l, quantity: Math.max(1, quantity) }
              : l,
          ),
        })),
      clear: () => set({ lines: [] }),
      subtotal: () =>
        get().lines.reduce((acc, l) => acc + l.price * l.quantity, 0),
      count: () => get().lines.reduce((acc, l) => acc + l.quantity, 0),
    }),
    {
      name: "lydieshop-cart",
    },
  ),
);

// Règles de livraison par défaut
export const SHIPPING = {
  FREE_THRESHOLD: 60,
  COLISSIMO: { label: "Colissimo", base: 5.9, delay: "2-3 jours ouvrés" },
  MONDIAL_RELAY: {
    label: "Mondial Relay",
    base: 3.9,
    delay: "3-5 jours ouvrés",
  },
  CHRONOPOST: { label: "Chronopost", base: 12.9, delay: "24h" },
};

export const computeShipping = (
  subtotal: number,
  method: keyof typeof SHIPPING = "COLISSIMO",
) => {
  if (method === "FREE_THRESHOLD") return 0;
  const option = SHIPPING[method];
  if (typeof option === "number") return 0;
  if (subtotal >= SHIPPING.FREE_THRESHOLD) return 0;
  return option.base;
};

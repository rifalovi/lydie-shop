// Règles de livraison — module pur, importable côté serveur ET client.
// Ne pas ajouter "use client" ici sous peine de casser /api/checkout.

export type ShippingMethodId = "COLISSIMO" | "MONDIAL_RELAY" | "CHRONOPOST";

export const SHIPPING = {
  FREE_THRESHOLD: 60,
  COLISSIMO: { label: "Colissimo", base: 5.9, delay: "2-3 jours ouvrés" },
  MONDIAL_RELAY: {
    label: "Mondial Relay",
    base: 3.9,
    delay: "3-5 jours ouvrés",
  },
  CHRONOPOST: { label: "Chronopost", base: 12.9, delay: "24h" },
} as const;

export const computeShipping = (
  subtotal: number,
  method: ShippingMethodId = "COLISSIMO",
): number => {
  const option = SHIPPING[method];
  if (subtotal >= SHIPPING.FREE_THRESHOLD) return 0;
  return option.base;
};

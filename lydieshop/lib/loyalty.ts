// Programme de fidélité Lydie'shop — règles pures, importables partout.
//
// Règle d'attribution (cf. README) : 1€ dépensé = 10 points Couronne.
// Le sous-total seul est comptabilisé (la livraison ne rapporte pas de points).
//
// Récompenses :
//   - 500 pts  → -5€
//   - 1 000 pts → -12€
//   - 2 000 pts → -30€

import type { Tier } from "@prisma/client";

export const POINTS_PER_EURO = 10;

export type TierDefinition = {
  id: Tier;
  label: string;
  emoji: string;
  threshold: number;
  perks: string[];
};

export const TIERS: TierDefinition[] = [
  {
    id: "ROSE",
    label: "Reine Rose",
    emoji: "🌸",
    threshold: 0,
    perks: ["Cadeau surprise dans chaque commande", "Accès au support prioritaire"],
  },
  {
    id: "GOLD",
    label: "Reine Or",
    emoji: "👑",
    threshold: 1000,
    perks: ["Livraison express offerte", "-10% permanent sur les accessoires"],
  },
  {
    id: "DIAMOND",
    label: "Reine Diamant",
    emoji: "💎",
    threshold: 5000,
    perks: ["Ventes privées en avant-première", "Coffret anniversaire offert"],
  },
];

export const REWARDS = [
  { points: 500, discount: 5 },
  { points: 1000, discount: 12 },
  { points: 2000, discount: 30 },
] as const;

export type Reward = (typeof REWARDS)[number];

// Retourne la récompense officielle correspondant à une paire reçue du
// client, ou null si elle ne fait pas partie du barème.
export function findReward(points: number, discount: number): Reward | null {
  return (
    REWARDS.find((r) => r.points === points && r.discount === discount) ?? null
  );
}

// Retourne toutes les récompenses utilisables avec un solde donné.
export function getAvailableRewards(points: number): Reward[] {
  return REWARDS.filter((r) => r.points <= points);
}

export function computePointsForOrder(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return Math.floor(subtotal * POINTS_PER_EURO);
}

export function computeTier(points: number): Tier {
  if (points >= 5000) return "DIAMOND";
  if (points >= 1000) return "GOLD";
  return "ROSE";
}

export function getTierDefinition(tier: Tier): TierDefinition {
  return TIERS.find((t) => t.id === tier) ?? TIERS[0];
}

export function getNextTier(points: number): {
  next: TierDefinition | null;
  remaining: number;
} {
  const current = computeTier(points);
  const currentIdx = TIERS.findIndex((t) => t.id === current);
  const next = TIERS[currentIdx + 1] ?? null;
  if (!next) return { next: null, remaining: 0 };
  return { next, remaining: next.threshold - points };
}

export function getNextReward(points: number) {
  return REWARDS.find((r) => r.points > points) ?? null;
}

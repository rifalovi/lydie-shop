"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Récompense fidélité sélectionnée par la cliente dans /panier — portée jusqu'à
// /checkout via localStorage. Le serveur re-valide la cohérence (solde de
// points, sous-total suffisant) au moment du POST /api/checkout.
export type SelectedReward = {
  points: number;
  discount: number;
};

type State = {
  reward: SelectedReward | null;
  select: (reward: SelectedReward | null) => void;
  clear: () => void;
};

export const useRewardStore = create<State>()(
  persist(
    (set) => ({
      reward: null,
      select: (reward) => set({ reward }),
      clear: () => set({ reward: null }),
    }),
    { name: "lydieshop-reward" },
  ),
);

"use client";

import { create } from "zustand";

// Source de vérité côté client pour l'état des favoris — hydraté au mount
// depuis /api/wishlist via WishlistBootstrap quand l'utilisateur est connecté.
type WishlistState = {
  productIds: Set<string>;
  hydrated: boolean;
  setAll: (ids: string[]) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useWishlist = create<WishlistState>((set) => ({
  productIds: new Set<string>(),
  hydrated: false,
  setAll: (ids) =>
    set({ productIds: new Set(ids), hydrated: true }),
  add: (id) =>
    set((state) => {
      const next = new Set(state.productIds);
      next.add(id);
      return { productIds: next };
    }),
  remove: (id) =>
    set((state) => {
      const next = new Set(state.productIds);
      next.delete(id);
      return { productIds: next };
    }),
  clear: () => set({ productIds: new Set<string>(), hydrated: false }),
}));

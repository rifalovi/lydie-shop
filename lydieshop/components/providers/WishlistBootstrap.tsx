"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useWishlist } from "@/lib/wishlist";

// Charge les favoris depuis le serveur dès qu'une session est disponible.
// Vide le store à la déconnexion.
export function WishlistBootstrap() {
  const { data: session, status } = useSession();
  const setAll = useWishlist((s) => s.setAll);
  const clear = useWishlist((s) => s.clear);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      clear();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/wishlist");
        if (!res.ok) return;
        const data = (await res.json()) as { productIds: string[] };
        if (!cancelled) setAll(data.productIds);
      } catch {
        /* réseau — on réessaiera au prochain mount */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session, setAll, clear]);

  return null;
}

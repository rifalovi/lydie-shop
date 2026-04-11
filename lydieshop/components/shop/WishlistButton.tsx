"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { cx } from "@/lib/format";

type Variant = "card" | "pill";

export function WishlistButton({
  productId,
  variant = "card",
  className,
}: {
  productId: string;
  variant?: Variant;
  className?: string;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const inWishlist = useWishlist((s) => s.productIds.has(productId));
  const add = useWishlist((s) => s.add);
  const remove = useWishlist((s) => s.remove);
  const [loading, setLoading] = useState(false);

  const toggle = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (status !== "authenticated" || !session?.user) {
      router.push(`/login?callbackUrl=/boutique`);
      return;
    }
    if (loading) return;
    setLoading(true);

    // Optimiste : on inverse tout de suite l'état, on rollback si le serveur
    // refuse.
    const wasIn = inWishlist;
    if (wasIn) remove(productId);
    else add(productId);

    try {
      const res = wasIn
        ? await fetch(
            `/api/wishlist?productId=${encodeURIComponent(productId)}`,
            { method: "DELETE" },
          )
        : await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
      if (!res.ok) {
        // Rollback
        if (wasIn) add(productId);
        else remove(productId);
      }
    } catch {
      if (wasIn) add(productId);
      else remove(productId);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-pressed={inWishlist}
        aria-label={
          inWishlist ? "Retirer des favoris" : "Ajouter aux favoris"
        }
        className={cx(
          "inline-flex items-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-ui font-semibold transition-all",
          inWishlist
            ? "border-rose-dark bg-rose-dark text-white"
            : "border-rose-dark bg-white text-rose-dark hover:bg-rose-light",
          className,
        )}
      >
        <Heart
          className={cx("h-4 w-4", inWishlist && "fill-current")}
        />
        {inWishlist ? "Dans vos favoris" : "Ajouter aux favoris"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-pressed={inWishlist}
      aria-label={inWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={cx(
        "rounded-full bg-white/90 p-2 shadow-soft transition-all hover:bg-white hover:scale-110",
        inWishlist ? "text-rose-dark" : "text-ink",
        className,
      )}
    >
      <Heart
        className={cx("h-4 w-4", inWishlist && "fill-rose-dark text-rose-dark")}
      />
    </button>
  );
}

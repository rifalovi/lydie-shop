"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { useRewardStore } from "@/lib/reward-store";

export function ClearCartOnMount() {
  const clear = useCart((s) => s.clear);
  const clearReward = useRewardStore((s) => s.clear);
  useEffect(() => {
    clear();
    clearReward();
  }, [clear, clearReward]);
  return null;
}

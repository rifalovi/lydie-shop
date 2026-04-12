"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldPlus, ShieldOff, Loader2 } from "lucide-react";

export function AdminRoleActions({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // SUPER_ADMIN ne peut pas être modifié via l'UI.
  if (currentRole === "SUPER_ADMIN") {
    return (
      <span className="text-xs text-ink-muted italic">Protégé</span>
    );
  }

  const action = currentRole === "CUSTOMER" ? "promote" : "demote";
  const label = action === "promote" ? "Promouvoir" : "Révoquer";
  const Icon = action === "promote" ? ShieldPlus : ShieldOff;

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-ui font-bold transition-all disabled:opacity-60 ${
        action === "promote"
          ? "bg-gradient-gold text-white hover:opacity-90"
          : "border-2 border-rose-dark bg-white text-rose-dark hover:bg-rose-light"
      }`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Icon className="h-3.5 w-3.5" />
      )}
      {label}
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, Loader2 } from "lucide-react";

export function ReviewModerationActions({
  reviewId,
  isApproved,
}: {
  reviewId: string;
  isApproved: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const act = async (action: "approve" | "reject") => {
    setLoading(action);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reviewId, action }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2">
      {!isApproved && (
        <button
          type="button"
          onClick={() => act("approve")}
          disabled={loading !== null}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-gold px-4 py-2 text-xs font-ui font-bold text-white shadow-soft transition-all hover:opacity-90 disabled:opacity-60"
        >
          {loading === "approve" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Approuver
        </button>
      )}
      <button
        type="button"
        onClick={() => act("reject")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 rounded-full border-2 border-rose-dark bg-white px-4 py-2 text-xs font-ui font-bold text-rose-dark transition-all hover:bg-rose-light disabled:opacity-60"
      >
        {loading === "reject" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        Supprimer
      </button>
    </div>
  );
}

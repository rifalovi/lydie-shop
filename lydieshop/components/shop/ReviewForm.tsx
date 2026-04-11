"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cx } from "@/lib/format";

export function ReviewForm({ productId }: { productId: string }) {
  const { data: session, status } = useSession();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return <div className="card-luxe p-6 text-sm text-ink-muted">Chargement…</div>;
  }

  if (!session?.user) {
    return (
      <div className="card-luxe p-6">
        <p className="text-sm text-ink-muted">
          <Link
            href="/login?callbackUrl=/boutique"
            className="font-ui font-semibold text-rose-dark hover:underline"
          >
            Connectez-vous
          </Link>{" "}
          pour laisser un avis sur ce produit.
        </p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (rating < 1) {
      setError("Donnez une note de 1 à 5 étoiles.");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, title, comment }),
    });
    const data = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      setError(data?.error ?? "Impossible d'enregistrer l'avis.");
      return;
    }

    setMessage(
      "Merci ! Votre avis a été envoyé, il sera publié après modération.",
    );
    setRating(0);
    setTitle("");
    setComment("");
  };

  return (
    <form onSubmit={submit} className="card-luxe space-y-4 p-6">
      <h3 className="font-serif text-xl">Laisser un avis</h3>

      <div>
        <p className="mb-2 text-sm font-ui font-semibold text-ink">
          Votre note
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
              className="p-0.5"
            >
              <Star
                className={cx(
                  "h-7 w-7 transition-colors",
                  i <= (hover || rating)
                    ? "fill-gold text-gold"
                    : "text-borderSoft",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Titre (optionnel)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Une expérience royale"
        maxLength={120}
      />

      <div>
        <label className="mb-1.5 block text-sm font-ui font-semibold text-ink">
          Votre avis
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={2000}
          className="input-luxe resize-none"
          placeholder="Partagez votre expérience avec ce produit…"
        />
      </div>

      {error && (
        <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-soft bg-gold-light/40 px-3 py-2 text-sm text-gold-dark">
          {message}
        </p>
      )}

      <Button disabled={loading}>
        {loading ? "Envoi..." : "Publier mon avis"}
      </Button>
    </form>
  );
}

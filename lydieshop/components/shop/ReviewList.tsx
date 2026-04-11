import { StarRating } from "@/components/ui/StarRating";
import { formatDate } from "@/lib/format";

export type PublicReview = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  authorName: string;
};

export function ReviewList({ reviews }: { reviews: PublicReview[] }) {
  if (reviews.length === 0) {
    return (
      <div className="card-luxe p-6 text-sm text-ink-muted">
        Aucun avis pour le moment. Soyez la première à partager votre
        expérience&nbsp;!
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {reviews.map((r) => {
        const initial = (r.authorName || "R").trim().charAt(0).toUpperCase();
        return (
          <li key={r.id} className="card-luxe p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-royal font-ui font-bold text-white">
                  {initial}
                </div>
                <div>
                  <p className="font-ui font-bold text-ink">{r.authorName}</p>
                  <p className="text-xs text-ink-muted">
                    {formatDate(r.createdAt)}
                  </p>
                </div>
              </div>
              <StarRating value={r.rating} />
            </div>
            {r.title && (
              <p className="mt-3 font-serif text-lg">{r.title}</p>
            )}
            {r.comment && (
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {r.comment}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

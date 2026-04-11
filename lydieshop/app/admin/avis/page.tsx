import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { StarRating } from "@/components/ui/StarRating";
import { ReviewModerationActions } from "./ReviewModerationActions";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const filter = searchParams.status ?? "pending";
  const where =
    filter === "approved"
      ? { isApproved: true }
      : filter === "all"
        ? {}
        : { isApproved: false };

  const [reviews, pendingCount, approvedCount] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
      take: 100,
    }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.review.count({ where: { isApproved: true } }),
  ]);

  const tabs = [
    { id: "pending", label: "À modérer", count: pendingCount },
    { id: "approved", label: "Publiés", count: approvedCount },
    { id: "all", label: "Tous", count: pendingCount + approvedCount },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
          Modération
        </p>
        <h1 className="mt-1 font-serif text-4xl">Avis clientes</h1>
        <p className="mt-2 text-ink-muted">
          Validez ou supprimez les avis soumis par vos clientes. Les avis
          approuvés alimentent la note moyenne affichée sur chaque produit.
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/admin/avis?status=${t.id}`}
            className={`rounded-full px-4 py-2 text-sm font-ui font-semibold transition-colors ${
              filter === t.id
                ? "bg-gradient-royal text-white"
                : "bg-white text-ink hover:bg-rose-light"
            }`}
          >
            {t.label}{" "}
            <span
              className={`ml-1 text-xs ${
                filter === t.id ? "text-white/80" : "text-ink-muted"
              }`}
            >
              ({t.count})
            </span>
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="card-luxe p-12 text-center text-ink-muted">
          Aucun avis dans cette catégorie.
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="card-luxe p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <StarRating value={r.rating} />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-ui font-bold uppercase tracking-wider ${
                        r.isApproved
                          ? "bg-gradient-gold text-white"
                          : "bg-rose-light text-rose-dark"
                      }`}
                    >
                      {r.isApproved ? "Publié" : "En attente"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">
                    Par{" "}
                    <strong className="text-ink">
                      {r.user.name ?? r.user.email}
                    </strong>{" "}
                    · {formatDate(r.createdAt.toISOString())} · sur{" "}
                    <Link
                      href={`/produit/${r.product.slug}`}
                      className="text-rose-dark hover:underline"
                    >
                      {r.product.name}
                    </Link>
                  </p>
                  {r.title && (
                    <p className="mt-3 font-serif text-lg">{r.title}</p>
                  )}
                  {r.comment && (
                    <p className="mt-2 text-sm text-ink">{r.comment}</p>
                  )}
                </div>
                <ReviewModerationActions
                  reviewId={r.id}
                  isApproved={r.isApproved}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

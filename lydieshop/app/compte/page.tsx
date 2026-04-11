import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Heart, Package, User, Gift, Star } from "lucide-react";
import { CrownIcon } from "@/components/ui/Crown";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatEUR, formatDate } from "@/lib/format";
import {
  getTierDefinition,
  getNextTier,
  getNextReward,
} from "@/lib/loyalty";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-borderSoft text-ink" },
  CONFIRMED: { label: "Confirmée", color: "bg-rose-light text-rose-dark" },
  PROCESSING: {
    label: "En préparation",
    color: "bg-gold-light/40 text-gold-dark",
  },
  SHIPPED: { label: "Expédiée", color: "bg-gradient-royal text-white" },
  DELIVERED: { label: "Livrée", color: "bg-gradient-gold text-white" },
  CANCELLED: { label: "Annulée", color: "bg-borderSoft text-ink-muted" },
  REFUNDED: { label: "Remboursée", color: "bg-borderSoft text-ink-muted" },
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/compte");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { items: true },
      },
      wishlist: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const tierInfo = getTierDefinition(user.tier);
  const { next, remaining } = getNextTier(user.loyaltyPoints);
  const nextReward = getNextReward(user.loyaltyPoints);

  const ordersInProgress = user.orders.filter((o) =>
    ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(o.status),
  ).length;

  const firstName = user.name?.split(" ")[0] ?? "Reine";

  return (
    <div className="container-page py-12">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
            Votre espace
          </p>
          <h1 className="mt-1 font-serif text-4xl md:text-5xl">
            Bonjour,{" "}
            <span className="font-script title-gold">{firstName}</span>{" "}
            {tierInfo.emoji}
          </h1>
        </div>
        <div className="card-luxe px-6 py-4">
          <div className="flex items-center gap-3">
            <CrownIcon className="h-5 w-5 text-gold" />
            <div>
              <p className="text-xs text-ink-muted">Niveau actuel</p>
              <p className="font-ui font-bold text-ink">{tierInfo.label}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock
          icon={Package}
          label="Commandes"
          value={user.orders.length.toString()}
          hint={
            ordersInProgress > 0
              ? `${ordersInProgress} en cours`
              : "Toutes livrées"
          }
        />
        <StatBlock
          icon={Heart}
          label="Favoris"
          value={user.wishlist.length.toString()}
          hint="voir ma sélection"
        />
        <StatBlock
          icon={CrownIcon}
          label="Points Couronne"
          value={user.loyaltyPoints.toLocaleString("fr-FR")}
          hint={
            nextReward
              ? `Prochaine récompense : -${nextReward.discount}€ (${nextReward.points} pts)`
              : "Vous avez atteint la récompense max"
          }
        />
        <StatBlock
          icon={Gift}
          label="Prochain niveau"
          value={next ? `${next.emoji} ${next.label}` : "Max"}
          hint={
            next
              ? `${remaining.toLocaleString("fr-FR")} points à gagner`
              : "Reine Diamant atteinte"
          }
        />
      </div>

      {/* Carte fidélité détaillée */}
      <section className="mt-10 card-luxe overflow-hidden">
        <div className="bg-gradient-royal p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-ui text-xs font-bold uppercase tracking-widest text-white/80">
                Programme fidélité
              </p>
              <p className="mt-1 font-serif text-3xl">
                {tierInfo.emoji} {tierInfo.label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/80">Solde</p>
              <p className="font-num text-4xl font-bold">
                {user.loyaltyPoints.toLocaleString("fr-FR")}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-white/80">
                points Couronne
              </p>
            </div>
          </div>

          {next && (
            <div className="mt-5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (user.loyaltyPoints / next.threshold) * 100,
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-white/90">
                Plus que <strong>{remaining.toLocaleString("fr-FR")}</strong>{" "}
                points pour devenir {next.emoji} {next.label}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div>
            <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
              Vos avantages
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {tierInfo.perks.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
              Récompenses
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between rounded-soft bg-gradient-rose-soft px-3 py-2">
                <span>500 points</span>
                <span className="font-num font-bold">-5€</span>
              </li>
              <li className="flex items-center justify-between rounded-soft bg-gradient-rose-soft px-3 py-2">
                <span>1 000 points</span>
                <span className="font-num font-bold">-12€</span>
              </li>
              <li className="flex items-center justify-between rounded-soft bg-gradient-rose-soft px-3 py-2">
                <span>2 000 points</span>
                <span className="font-num font-bold">-30€</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Mes commandes récentes</h2>
            <Link
              href="/compte/favoris"
              className="text-sm font-ui font-semibold text-rose-dark hover:underline"
            >
              Mes favoris →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {user.orders.length === 0 ? (
              <div className="card-luxe p-8 text-center text-ink-muted">
                Vous n&apos;avez pas encore passé de commande.
                <div className="mt-4">
                  <Link
                    href="/boutique"
                    className="font-ui font-semibold text-rose-dark hover:underline"
                  >
                    Découvrir la boutique →
                  </Link>
                </div>
              </div>
            ) : (
              user.orders.map((o) => {
                const s = statusLabel[o.status] ?? statusLabel.PENDING;
                return (
                  <div
                    key={o.id}
                    className="card-luxe flex items-center justify-between p-5"
                  >
                    <div>
                      <p className="font-ui font-bold text-ink">
                        {o.orderNumber}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {formatDate(o.createdAt.toISOString())} ·{" "}
                        {o.items.length} article
                        {o.items.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-[11px] font-ui font-semibold ${s.color}`}
                      >
                        {s.label}
                      </span>
                      <p className="mt-1 font-num text-lg font-bold">
                        {formatEUR(Number(o.total))}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card-luxe p-5">
            <div className="flex items-center gap-2 text-gold-dark">
              <User className="h-4 w-4" />
              <p className="font-ui text-xs font-bold uppercase tracking-widest">
                Profil
              </p>
            </div>
            <p className="mt-3 text-sm text-ink">
              {user.name ?? "Reine"}
              <br />
              {user.email}
              {user.phone && (
                <>
                  <br />
                  {user.phone}
                </>
              )}
            </p>
          </div>

          <div className="card-luxe p-5">
            <div className="flex items-center gap-2 text-gold-dark">
              <Star className="h-4 w-4" />
              <p className="font-ui text-xs font-bold uppercase tracking-widest">
                Laisser un avis
              </p>
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              Partagez votre expérience sur vos derniers achats et gagnez 50
              points par avis approuvé.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatBlock({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="card-luxe p-5">
      <div className="flex items-center gap-2 text-gold-dark">
        <Icon className="h-4 w-4" />
        <p className="font-ui text-xs font-bold uppercase tracking-widest">
          {label}
        </p>
      </div>
      <p className="mt-3 font-num text-3xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-muted">{hint}</p>
    </div>
  );
}

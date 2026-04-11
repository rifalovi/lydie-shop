import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CrownIcon } from "@/components/ui/Crown";
import { prisma } from "@/lib/prisma";
import { formatEUR } from "@/lib/format";
import { ClearCartOnMount } from "./ClearCartOnMount";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: { orderNumber?: string; session_id?: string };
}) {
  const orderNumber = searchParams.orderNumber;

  const order = orderNumber
    ? await prisma.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      })
    : null;

  const isPaid = order?.paymentStatus === "PAID";
  const total = order ? Number(order.total) : null;

  return (
    <div className="container-page py-20">
      {/* Vide le panier côté client une fois la commande payée */}
      {isPaid && <ClearCartOnMount />}

      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-royal text-white shadow-lift">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="mt-8 font-serif text-4xl md:text-5xl">
          Merci, Reine ! <span className="font-script title-gold">✨</span>
        </h1>

        {order ? (
          <p className="mt-4 text-ink-muted">
            Votre commande{" "}
            <span className="font-ui font-bold text-ink">
              {order.orderNumber}
            </span>{" "}
            est{" "}
            {isPaid
              ? "confirmée et payée"
              : "en cours de validation par notre prestataire de paiement"}
            . Vous recevrez un email avec le récapitulatif et le numéro de suivi
            dès l&apos;expédition (sous 24h ouvrées).
          </p>
        ) : (
          <p className="mt-4 text-ink-muted">
            Votre paiement est en cours de traitement. Vous recevrez un email
            de confirmation très prochainement.
          </p>
        )}

        {order && total !== null && (
          <div className="mt-8 rounded-luxe border border-borderSoft bg-white p-6 text-left">
            <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
              Récapitulatif
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {order.items.map((it) => (
                <li key={it.id} className="flex justify-between">
                  <span>
                    {it.quantity}× {it.name}
                  </span>
                  <span className="font-num font-bold">
                    {formatEUR(Number(it.price) * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-borderSoft pt-3">
              <span className="font-ui font-bold">Total</span>
              <span className="font-num text-xl font-bold">
                {formatEUR(total)}
              </span>
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/compte">
            <Button>Voir mes commandes</Button>
          </Link>
          <Link href="/boutique">
            <Button variant="secondary">Continuer les achats</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

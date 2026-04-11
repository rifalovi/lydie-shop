import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CrownIcon } from "@/components/ui/Crown";

export default function ConfirmationPage({
  searchParams,
}: {
  searchParams: { orderNumber?: string };
}) {
  const orderNumber = searchParams.orderNumber ?? "LYD-2026-0001";
  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-royal text-white shadow-lift">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="mt-8 font-serif text-4xl md:text-5xl">
          Merci, Reine ! <span className="font-script title-gold">✨</span>
        </h1>
        <p className="mt-4 text-ink-muted">
          Votre commande{" "}
          <span className="font-ui font-bold text-ink">{orderNumber}</span> est
          confirmée. Vous recevrez un email avec le récapitulatif et le numéro
          de suivi dès l&apos;expédition (sous 24h ouvrées).
        </p>

        <div className="mt-8 rounded-luxe border border-borderSoft bg-white p-6 text-left">
          <div className="flex items-center gap-2 text-gold-dark">
            <CrownIcon className="h-4 w-4" />
            <p className="font-ui text-xs font-bold uppercase tracking-widest">
              Programme fidélité
            </p>
          </div>
          <p className="mt-2 text-ink">
            Vous avez gagné{" "}
            <span className="font-num text-2xl font-bold title-gold">
              +2490
            </span>{" "}
            points Couronne. Encore quelques achats et vous débloquez le niveau{" "}
            <span className="font-ui font-bold">Reine Or</span>.
          </p>
        </div>

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

"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Mail, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CrownIcon } from "@/components/ui/Crown";

export default function CheckEmailPage() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resend = async () => {
    setSending(true);
    setError(null);
    setSent(false);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d?.error ?? "Impossible de renvoyer l'email.");
        return;
      }
      if (d.alreadyVerified) {
        window.location.href = "/compte";
        return;
      }
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-royal text-white shadow-lift">
          <Mail className="h-10 w-10" />
        </div>

        <h1 className="mt-8 font-serif text-4xl">
          Vérifiez votre{" "}
          <span className="font-script title-gold">email</span>
        </h1>

        <div className="card-luxe mt-8 p-8 text-left">
          <div className="flex items-center gap-3 text-gold-dark">
            <CrownIcon className="h-5 w-5" />
            <p className="font-ui text-xs font-bold uppercase tracking-widest">
              Dernière étape
            </p>
          </div>
          <p className="mt-4 text-sm text-ink">
            Nous avons envoyé un email de vérification à votre adresse. Cliquez
            sur le lien dans l&apos;email pour activer votre compte et profiter
            de Lydie&apos;shop.
          </p>
          <p className="mt-3 text-xs text-ink-muted">
            Le lien est valable <strong>24 heures</strong>. Pensez à vérifier
            vos spams.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {sent && (
            <p className="rounded-soft bg-gold-light/40 px-3 py-2 text-sm text-gold-dark">
              Email renvoyé avec succès.
            </p>
          )}
          {error && (
            <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">
              {error}
            </p>
          )}

          <Button
            onClick={resend}
            disabled={sending}
            variant="secondary"
            className="w-full"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Renvoyer l&apos;email de vérification
          </Button>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-sm font-ui font-semibold text-ink-muted hover:text-rose-dark hover:underline"
          >
            Se déconnecter
          </button>
        </div>

        <p className="mt-8 text-xs text-ink-muted">
          Besoin d&apos;aide ?{" "}
          <Link
            href="mailto:contact@lydie-shop.fr"
            className="font-semibold text-rose-dark hover:underline"
          >
            contact@lydie-shop.fr
          </Link>
        </p>
      </div>
    </div>
  );
}

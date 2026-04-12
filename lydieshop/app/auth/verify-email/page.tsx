"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CrownIcon } from "@/components/ui/Crown";

function VerifyForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("Lien de vérification invalide.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(data?.error ?? "Vérification impossible.");
        }
      } catch {
        setStatus("error");
        setErrorMsg("Erreur réseau.");
      }
    })();
  }, [token]);

  if (status === "loading") {
    return (
      <div className="card-luxe mt-8 flex flex-col items-center gap-4 p-12">
        <Loader2 className="h-10 w-10 animate-spin text-rose-dark" />
        <p className="font-serif text-lg">Vérification en cours...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="card-luxe mt-8 p-8 text-center">
        <XCircle className="mx-auto h-12 w-12 text-rose-dark" />
        <p className="mt-4 font-serif text-xl">Vérification échouée</p>
        <p className="mt-2 text-sm text-ink-muted">{errorMsg}</p>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/auth/check-email">
            <Button className="w-full">Renvoyer un email</Button>
          </Link>
          <Link
            href="/login"
            className="text-sm font-ui font-semibold text-rose-dark hover:underline"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card-luxe mt-8 p-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-gold text-white">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h2 className="mt-4 font-serif text-2xl">Email confirmé !</h2>
      <p className="mt-2 text-sm text-ink-muted">
        Votre compte est maintenant actif. Bienvenue dans le cercle des Reines.
      </p>
      <div className="mt-6">
        <Link href="/compte">
          <Button size="lg">Accéder à mon espace</Button>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md text-center">
        <CrownIcon className="mx-auto h-10 w-10 text-gold" />
        <h1 className="mt-4 font-serif text-4xl">
          Vérification{" "}
          <span className="font-script title-gold">email</span>
        </h1>
        <Suspense
          fallback={
            <div className="card-luxe mt-8 flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-rose-dark" />
            </div>
          }
        >
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CrownIcon } from "@/components/ui/Crown";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // On ignore sciemment les erreurs côté client : l'API renvoie 200 dans
    // tous les cas pour ne pas indiquer si l'email existe. Même comportement
    // si le réseau lâche — on montre quand même l'écran de confirmation.
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});

    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <CrownIcon className="mx-auto h-10 w-10 text-gold" />
          <h1 className="mt-4 font-serif text-4xl">
            Mot de passe{" "}
            <span className="font-script title-gold">oublié</span>
          </h1>
          <p className="mt-2 text-ink-muted">
            Entrez votre email — nous vous envoyons un lien pour en choisir un
            nouveau.
          </p>
        </div>

        {submitted ? (
          <div className="card-luxe mt-8 p-8 text-center">
            <p className="font-serif text-xl">Email envoyé ✨</p>
            <p className="mt-3 text-sm text-ink-muted">
              Si un compte existe avec l&apos;adresse{" "}
              <strong className="text-ink">{email}</strong>, vous allez
              recevoir un email avec un lien de réinitialisation dans quelques
              instants. Le lien est valable pendant <strong>1 heure</strong>.
            </p>
            <p className="mt-4 text-xs text-ink-muted">
              Pensez à vérifier vos spams si vous ne voyez rien arriver.
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="font-ui font-semibold text-rose-dark hover:underline"
              >
                ← Retour à la connexion
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="card-luxe mt-8 space-y-4 p-8"
            noValidate
          >
            <Input
              label="Email"
              type="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button className="w-full" size="lg" disabled={loading}>
              {loading ? "Envoi en cours..." : "Envoyer le lien"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink-muted">
          Vous vous souvenez ?{" "}
          <Link
            href="/login"
            className="font-ui font-semibold text-rose-dark hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CrownIcon } from "@/components/ui/Crown";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="card-luxe mt-8 p-8 text-center">
        <p className="font-serif text-xl text-rose-dark">Lien invalide</p>
        <p className="mt-3 text-sm text-ink-muted">
          Ce lien de réinitialisation est incomplet ou a été tronqué. Demandez
          un nouveau lien à partir du formulaire « mot de passe oublié ».
        </p>
        <div className="mt-6">
          <Link href="/auth/forgot-password">
            <Button>Demander un nouveau lien</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      setError(
        data?.error ?? "Impossible de réinitialiser le mot de passe.",
      );
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 2500);
  };

  if (success) {
    return (
      <div className="card-luxe mt-8 p-8 text-center">
        <p className="font-serif text-xl">Mot de passe modifié ✨</p>
        <p className="mt-3 text-sm text-ink-muted">
          Vous allez être redirigée vers la page de connexion...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card-luxe mt-8 space-y-4 p-8"
      noValidate
    >
      <Input
        label="Nouveau mot de passe"
        type="password"
        name="password"
        required
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint="8 caractères minimum"
      />
      <Input
        label="Confirmer le mot de passe"
        type="password"
        name="confirm"
        required
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      {error && (
        <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">
          {error}
        </p>
      )}

      <Button className="w-full" size="lg" disabled={loading}>
        {loading ? "Modification..." : "Modifier mon mot de passe"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <CrownIcon className="mx-auto h-10 w-10 text-gold" />
          <h1 className="mt-4 font-serif text-4xl">
            Nouveau{" "}
            <span className="font-script title-gold">mot de passe</span>
          </h1>
          <p className="mt-2 text-ink-muted">
            Choisissez un mot de passe sûr pour votre compte.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="card-luxe mt-8 p-8">
              <p className="text-sm text-ink-muted">Chargement…</p>
            </div>
          }
        >
          <ResetForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link
            href="/login"
            className="font-ui font-semibold text-rose-dark hover:underline"
          >
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

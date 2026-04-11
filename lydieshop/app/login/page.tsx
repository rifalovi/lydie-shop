"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CrownIcon } from "@/components/ui/Crown";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/compte";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res || res.error) {
      setError("Email ou mot de passe incorrect.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
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
      <Input
        label="Mot de passe"
        type="password"
        name="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && (
        <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 text-ink-muted">
          <input type="checkbox" className="accent-rose-dark" /> Se souvenir de
          moi
        </label>
        <Link
          href="/auth/forgot-password"
          className="font-ui font-semibold text-rose-dark hover:underline"
        >
          Mot de passe oublié ?
        </Link>
      </div>
      <Button className="w-full" size="lg" disabled={loading}>
        {loading ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <CrownIcon className="mx-auto h-10 w-10 text-gold" />
          <h1 className="mt-4 font-serif text-4xl">
            Bon retour, <span className="font-script title-gold">Reine</span>
          </h1>
          <p className="mt-2 text-ink-muted">
            Connectez-vous à votre espace privé.
          </p>
        </div>

        <Suspense fallback={<div className="card-luxe mt-8 p-8" />}>
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="font-ui font-semibold text-rose-dark hover:underline"
          >
            Rejoignez le cercle des Reines
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CrownIcon } from "@/components/ui/Crown";

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accepted) {
      setError("Vous devez accepter les CGV pour continuer.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone: phone || null,
        password,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setError(data?.error ?? "Inscription impossible. Réessayez.");
      return;
    }

    // Connexion automatique après création du compte
    const signin = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!signin || signin.error) {
      // Compte créé mais signIn KO → renvoyer vers check-email quand même
      router.push("/auth/check-email");
      return;
    }

    // Redirige vers la page de vérification email (pas /compte, car l'email
    // n'est pas encore vérifié et le middleware y bloquera l'accès).
    router.push("/auth/check-email");
    router.refresh();
  };

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <CrownIcon className="mx-auto h-10 w-10 text-gold" />
          <h1 className="mt-4 font-serif text-4xl">
            Rejoignez le{" "}
            <span className="font-script title-gold">cercle</span>
          </h1>
          <p className="mt-2 text-ink-muted">
            100 points offerts et un code -10% dès l&apos;inscription.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card-luxe mt-8 space-y-4 p-8"
          noValidate
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              name="firstName"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Nom"
              name="lastName"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
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
            label="Téléphone"
            type="tel"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Mot de passe"
            type="password"
            name="password"
            required
            autoComplete="new-password"
            hint="8 caractères minimum"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label className="flex items-start gap-2 text-xs text-ink-muted">
            <input
              type="checkbox"
              required
              className="mt-0.5 accent-rose-dark"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>
              J&apos;accepte les{" "}
              <Link href="/cgv" className="text-rose-dark hover:underline">
                CGV
              </Link>{" "}
              et la{" "}
              <Link
                href="/confidentialite"
                className="text-rose-dark hover:underline"
              >
                politique de confidentialité
              </Link>
            </span>
          </label>

          {error && (
            <p className="rounded-soft bg-rose-light/60 px-3 py-2 text-sm text-rose-dark">
              {error}
            </p>
          )}

          <Button className="w-full" size="lg" disabled={loading}>
            {loading ? "Création du compte..." : "Créer mon compte"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Déjà membre ?{" "}
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

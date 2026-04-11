import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CrownIcon } from "@/components/ui/Crown";

export default function RegisterPage() {
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

        <form className="card-luxe mt-8 space-y-4 p-8">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom" name="firstName" required />
            <Input label="Nom" name="lastName" required />
          </div>
          <Input label="Email" type="email" name="email" required />
          <Input label="Téléphone" type="tel" name="phone" />
          <Input
            label="Mot de passe"
            type="password"
            name="password"
            required
            hint="8 caractères minimum"
          />
          <label className="flex items-start gap-2 text-xs text-ink-muted">
            <input
              type="checkbox"
              required
              className="mt-0.5 accent-rose-dark"
            />
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
          </label>
          <Button className="w-full" size="lg">
            Créer mon compte
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

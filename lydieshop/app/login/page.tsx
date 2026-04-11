import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CrownIcon } from "@/components/ui/Crown";

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

        <form className="card-luxe mt-8 space-y-4 p-8">
          <Input label="Email" type="email" name="email" required />
          <Input
            label="Mot de passe"
            type="password"
            name="password"
            required
          />
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-ink-muted">
              <input type="checkbox" className="accent-rose-dark" /> Se souvenir
              de moi
            </label>
            <Link
              href="/reset"
              className="font-ui font-semibold text-rose-dark hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <Button className="w-full" size="lg">
            Se connecter
          </Button>
        </form>

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

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CrownIcon } from "@/components/ui/Crown";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <CrownIcon className="mx-auto h-10 w-10 text-gold" />
      <h1 className="mt-6 font-serif text-6xl">404</h1>
      <p className="mt-2 font-serif text-2xl italic text-ink-muted">
        Cette page s&apos;est éclipsée du royaume.
      </p>
      <div className="mt-8">
        <Link href="/">
          <Button size="lg">Retour à la boutique</Button>
        </Link>
      </div>
    </div>
  );
}

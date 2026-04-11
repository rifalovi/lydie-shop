import Link from "next/link";
import { Instagram, Facebook, Mail } from "lucide-react";
import { CrownIcon } from "@/components/ui/Crown";

const columns = [
  {
    title: "Boutique",
    links: [
      { href: "/boutique", label: "Toutes les catégories" },
      { href: "/boutique?categorie=perruques", label: "Perruques" },
      { href: "/boutique?categorie=tissages", label: "Tissages" },
      { href: "/boutique?categorie=accessoires", label: "Accessoires" },
      { href: "/boutique?categorie=cadeaux", label: "Cadeaux" },
    ],
  },
  {
    title: "Service client",
    links: [
      { href: "/suivi", label: "Suivi de commande" },
      { href: "/compte", label: "Mon compte" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQ" },
      { href: "/retours", label: "Retours & remboursements" },
    ],
  },
  {
    title: "Maison Lydie",
    links: [
      { href: "/histoire", label: "Notre histoire" },
      { href: "/engagements", label: "Nos engagements" },
      { href: "/fidelite", label: "Programme Couronne" },
      { href: "/parrainage", label: "Parrainage" },
      { href: "/cgv", label: "CGV" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-borderSoft bg-gradient-rose-soft">
      <div className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <CrownIcon className="h-7 w-7 text-gold" />
              <span className="font-script text-3xl title-gold">
                Lydie&apos;shop
              </span>
            </Link>
            <p className="mt-4 max-w-sm font-serif text-lg italic text-ink-muted">
              La boutique qui sublime les Reines.
            </p>
            <p className="mt-2 max-w-sm text-sm text-ink-muted">
              Perruques et tissages naturels haut de gamme, avec l&apos;exigence
              d&apos;une marque pensée par et pour les femmes.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://instagram.com/lydieshop"
                className="rounded-full bg-white p-2.5 text-rose-dark shadow-soft transition-transform hover:-translate-y-0.5"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://facebook.com/lydieshop"
                className="rounded-full bg-white p-2.5 text-rose-dark shadow-soft transition-transform hover:-translate-y-0.5"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@lydieshop.com"
                className="rounded-full bg-white p-2.5 text-rose-dark shadow-soft transition-transform hover:-translate-y-0.5"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink transition-colors hover:text-rose-dark"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-borderSoft pt-6 text-xs text-ink-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} Lydie&apos;shop. Tous droits réservés.
          </p>
          <p className="flex items-center gap-2">
            Paiement sécurisé
            <span className="font-ui font-bold text-ink">Visa</span>·
            <span className="font-ui font-bold text-ink">Mastercard</span>·
            <span className="font-ui font-bold text-ink">Apple Pay</span>·
            <span className="font-ui font-bold text-ink">Google Pay</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

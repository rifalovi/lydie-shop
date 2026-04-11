"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { Heart, Menu, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { CrownIcon } from "@/components/ui/Crown";
import { SearchBar } from "@/components/shop/SearchBar";

const navLinks = [
  { href: "/boutique", label: "Boutique" },
  { href: "/boutique?categorie=perruques", label: "Perruques" },
  { href: "/boutique?categorie=tissages", label: "Tissages" },
  { href: "/boutique?categorie=accessoires", label: "Accessoires" },
  { href: "/boutique?categorie=cadeaux", label: "Cadeaux" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const count = useCart((s) => s.count());

  return (
    <header className="sticky top-0 z-40 border-b border-borderSoft/80 bg-cream/90 backdrop-blur">
      {/* Promo bar */}
      <div className="bg-gradient-royal text-white">
        <div className="container-page flex h-9 items-center justify-center text-xs font-ui font-semibold tracking-wide">
          <CrownIcon className="mr-2 h-3.5 w-3.5" />
          Livraison offerte dès 60€ · Cadeau surprise dans chaque commande
          <CrownIcon className="ml-2 h-3.5 w-3.5" />
        </div>
      </div>

      <div className="container-page flex h-20 items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <CrownIcon className="h-7 w-7 text-gold" />
          <span className="font-script text-3xl leading-none title-gold">
            Lydie&apos;shop
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-ui font-semibold text-ink transition-colors hover:text-rose-dark"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <Suspense
              fallback={
                <div className="h-10 w-[260px] rounded-full border border-borderSoft bg-white" />
              }
            >
              <SearchBar />
            </Suspense>
          </div>
          <Link
            href="/compte"
            className="hidden rounded-full p-2 text-ink transition-colors hover:bg-rose-light md:block"
            aria-label="Mon compte"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href="/compte?tab=favoris"
            className="hidden rounded-full p-2 text-ink transition-colors hover:bg-rose-light md:block"
            aria-label="Mes favoris"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            href="/panier"
            className="relative rounded-full p-2 text-ink transition-colors hover:bg-rose-light"
            aria-label="Panier"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-gold text-[10px] font-bold text-white shadow-gold">
                {count}
              </span>
            )}
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="rounded-full p-2 text-ink transition-colors hover:bg-rose-light lg:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="border-t border-borderSoft bg-cream lg:hidden">
          <div className="container-page flex flex-col gap-3 py-4">
            <Suspense
              fallback={
                <div className="h-11 w-full rounded-full border border-borderSoft bg-white" />
              }
            >
              <SearchBar variant="mobile" onSubmitted={() => setOpen(false)} />
            </Suspense>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-soft px-4 py-3 text-sm font-ui font-semibold text-ink hover:bg-rose-light"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-borderSoft" />
            <Link
              href="/compte"
              onClick={() => setOpen(false)}
              className="rounded-soft px-4 py-3 text-sm font-ui font-semibold text-ink hover:bg-rose-light"
            >
              Mon compte
            </Link>
            <Link
              href="/suivi"
              onClick={() => setOpen(false)}
              className="rounded-soft px-4 py-3 text-sm font-ui font-semibold text-ink hover:bg-rose-light"
            >
              Suivi de commande
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart, Home, ShoppingBag, Store, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { cx } from "@/lib/format";

const tabs = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/boutique", label: "Boutique", icon: Store },
  { href: "/compte/favoris", label: "Favoris", icon: Heart },
  { href: "/panier", label: "Panier", icon: ShoppingBag, showBadge: true },
  { href: "/compte", label: "Compte", icon: User },
];

export function BottomNav() {
  const { status } = useSession();
  const pathname = usePathname();
  const count = useCart((s) => s.count());

  // Visible uniquement pour les utilisateurs connectés, sur mobile.
  // Cache-le sur les pages admin (admin a sa propre nav).
  if (status !== "authenticated") return null;
  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-borderSoft bg-white/95 backdrop-blur md:hidden safe-bottom">
      <ul className="flex items-center justify-around">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active =
            t.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={cx(
                  "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-ui font-semibold transition-colors",
                  active ? "text-gold-dark" : "text-ink-muted",
                )}
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {t.showBadge && count > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-gold text-[8px] font-bold text-white">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

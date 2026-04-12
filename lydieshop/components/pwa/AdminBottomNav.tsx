"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Home, MoreHorizontal, Package, Users } from "lucide-react";
import { cx } from "@/lib/format";

const tabs = [
  { href: "/admin", label: "Dashboard", icon: Home, exact: true },
  { href: "/admin/produits", label: "Produits", icon: Box },
  { href: "/admin/commandes", label: "Commandes", icon: Package },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/more", label: "Plus", icon: MoreHorizontal },
];

// Page "Plus" pour regrouper les sections secondaires sur mobile.
// On redirige vers avis (la plus utilisée en mobile).
const moreHref = "/admin/avis";

export function AdminBottomNav() {
  const pathname = usePathname();

  // Les sections "Plus" : avis, analytics, promotions, admins.
  const isMore =
    pathname?.startsWith("/admin/avis") ||
    pathname?.startsWith("/admin/analytics") ||
    pathname?.startsWith("/admin/promotions") ||
    pathname?.startsWith("/admin/admins");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-borderSoft bg-white/95 backdrop-blur md:hidden safe-bottom">
      <ul className="flex items-center justify-around">
        {tabs.map((t) => {
          const Icon = t.icon;
          const href = t.label === "Plus" ? moreHref : t.href;
          const active =
            t.label === "Plus"
              ? isMore
              : t.exact
                ? pathname === t.href
                : pathname?.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link
                href={href}
                className={cx(
                  "flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-ui font-semibold transition-colors",
                  active ? "text-gold-dark" : "text-ink-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Box,
  Home,
  Package,
  ShoppingBag,
  Tag,
  Users,
  Star,
} from "lucide-react";
import { CrownIcon } from "@/components/ui/Crown";
import { cx } from "@/lib/format";

const items = [
  { href: "/admin", label: "Tableau de bord", icon: Home },
  { href: "/admin/produits", label: "Produits", icon: Box },
  { href: "/admin/commandes", label: "Commandes", icon: Package },
  { href: "/admin/clients", label: "Clientes", icon: Users },
  { href: "/admin/promotions", label: "Promotions", icon: Tag },
  { href: "/admin/avis", label: "Avis", icon: Star },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-borderSoft bg-white">
      <div className="border-b border-borderSoft p-6">
        <Link href="/" className="flex items-center gap-2">
          <CrownIcon className="h-6 w-6 text-gold" />
          <span className="font-script text-2xl title-gold">
            Lydie&apos;shop
          </span>
        </Link>
        <p className="mt-1 text-[10px] font-ui font-bold uppercase tracking-widest text-ink-muted">
          Back-office admin
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cx(
                    "flex items-center gap-3 rounded-soft px-3 py-2.5 text-sm font-ui font-semibold transition-colors",
                    active
                      ? "bg-gradient-rose-soft text-rose-dark"
                      : "text-ink hover:bg-cream",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-borderSoft p-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-soft px-3 py-2 text-xs font-ui font-semibold text-ink-muted hover:bg-cream"
        >
          <ShoppingBag className="h-4 w-4" />
          Retour à la boutique
        </Link>
      </div>
    </aside>
  );
}

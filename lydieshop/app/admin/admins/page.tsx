import { Shield } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { AdminRoleActions } from "./AdminRoleActions";

export const dynamic = "force-dynamic";

export default async function AdminAdminsPage() {
  const [staff, customers] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { name: "asc" },
      take: 50,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    }),
  ]);

  const roleStyle: Record<string, string> = {
    SUPER_ADMIN: "bg-gradient-royal text-white",
    ADMIN: "bg-gradient-gold text-white",
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-ui text-xs font-bold uppercase tracking-widest text-gold-dark">
          Super Admin
        </p>
        <h1 className="mt-1 font-serif text-4xl">Gestion des admins</h1>
        <p className="mt-2 text-ink-muted">
          Promouvez des clientes en ADMIN ou révoquez l&apos;accès.
          Seul un SUPER_ADMIN peut gérer cette section.
        </p>
      </div>

      {/* Staff existant */}
      <section className="card-luxe overflow-hidden">
        <div className="flex items-center gap-2 bg-gradient-rose-soft px-5 py-3 text-xs font-ui font-bold uppercase tracking-widest text-ink-muted">
          <Shield className="h-4 w-4" />
          Comptes staff ({staff.length})
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-widest text-ink-muted">
            <tr>
              <th className="px-5 py-2">Nom</th>
              <th className="px-5 py-2">Email</th>
              <th className="px-5 py-2">Depuis</th>
              <th className="px-5 py-2 text-right">Rôle</th>
              <th className="px-5 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((u) => (
              <tr
                key={u.id}
                className="border-t border-borderSoft/60 hover:bg-cream"
              >
                <td className="px-5 py-4 font-semibold">
                  {u.name ?? "—"}
                </td>
                <td className="px-5 py-4 text-ink-muted">{u.email}</td>
                <td className="px-5 py-4 text-ink-muted">
                  {formatDate(u.createdAt.toISOString())}
                </td>
                <td className="px-5 py-4 text-right">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-[10px] font-ui font-bold uppercase tracking-wider ${
                      roleStyle[u.role] ?? "bg-borderSoft text-ink"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <AdminRoleActions
                    userId={u.id}
                    currentRole={u.role}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Clientes à promouvoir */}
      <section className="card-luxe mt-8 overflow-hidden">
        <div className="bg-gradient-rose-soft px-5 py-3 text-xs font-ui font-bold uppercase tracking-widest text-ink-muted">
          Promouvoir une cliente en ADMIN
        </div>
        {customers.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-muted">
            Aucune cliente enregistrée.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-ink-muted">
              <tr>
                <th className="px-5 py-2">Nom</th>
                <th className="px-5 py-2">Email</th>
                <th className="px-5 py-2">Depuis</th>
                <th className="px-5 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-borderSoft/60 hover:bg-cream"
                >
                  <td className="px-5 py-4 font-semibold">
                    {c.name ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-ink-muted">{c.email}</td>
                  <td className="px-5 py-4 text-ink-muted">
                    {formatDate(c.createdAt.toISOString())}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <AdminRoleActions
                      userId={c.id}
                      currentRole="CUSTOMER"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

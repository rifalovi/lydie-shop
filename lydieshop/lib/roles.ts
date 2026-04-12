// Lydie'shop — helpers rôles
//
// Source unique de vérité pour les contrôles de rôle. Les API, pages et
// composants qui gatent par rôle doivent passer par ces helpers — évite de
// semer des `role === "ADMIN"` littéraux qu'on oublierait de mettre à jour
// si on ajoute un rôle plus tard.

import type { Role } from "@prisma/client";

// Tous les rôles considérés "staff" (peuvent accéder à /admin).
export const STAFF_ROLES: readonly Role[] = ["ADMIN", "SUPER_ADMIN"];

// Accepte un rôle Prisma, une string serialisée (session NextAuth), ou null.
export function isStaffRole(
  role: Role | string | null | undefined,
): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdmin(
  role: Role | string | null | undefined,
): boolean {
  return role === "SUPER_ADMIN";
}

// Destination par défaut après connexion.
// - Staff (ADMIN + SUPER_ADMIN)  → /admin
// - Customer                     → /compte
export function defaultLandingFor(
  role: Role | string | null | undefined,
): string {
  return isStaffRole(role) ? "/admin" : "/compte";
}

import type { DefaultSession } from "next-auth";

// Type union maintenu en sync avec l'enum Prisma `Role`. Si tu ajoutes un
// rôle dans schema.prisma, ajoute-le ici aussi.
type AppRole = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      emailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: AppRole;
    emailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    emailVerified: boolean;
  }
}

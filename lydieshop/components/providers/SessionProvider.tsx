"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { WishlistBootstrap } from "./WishlistBootstrap";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <WishlistBootstrap />
      {children}
    </NextAuthSessionProvider>
  );
}

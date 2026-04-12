import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    const token = req.nextauth.token;
    const role = token?.role;
    const isStaff = role === "ADMIN" || role === "SUPER_ADMIN";
    const emailVerified = token?.emailVerified;

    // ── Email verification gate ──
    // Si l'utilisatrice est connectée mais son email n'est pas vérifié,
    // ET qu'elle est CUSTOMER (les staff sont exemptés), on la redirige
    // vers /auth/check-email — sauf si elle est déjà sur une page de
    // vérification ou d'auth.
    const verificationExempt =
      path.startsWith("/auth/") ||
      path.startsWith("/api/auth/") ||
      path.startsWith("/login") ||
      path.startsWith("/register");

    if (
      token &&
      !emailVerified &&
      !isStaff &&
      !verificationExempt &&
      path !== "/auth/check-email"
    ) {
      return NextResponse.redirect(new URL("/auth/check-email", req.url));
    }

    // ── Admin gates ──
    if (path.startsWith("/admin/admins") && role !== "SUPER_ADMIN") {
      if (isStaff) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }

    if (path.startsWith("/admin") && !isStaff) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/compte/:path*",
    "/checkout/:path*",
    "/panier",
  ],
};

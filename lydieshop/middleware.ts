import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    const role = req.nextauth.token?.role;

    // Espace admin réservé aux utilisateurs ADMIN.
    if (path.startsWith("/admin") && role !== "ADMIN") {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // `authorized` est appelé en premier — un token signifie "connecté".
      // On laisse `middleware` ci-dessus gérer le contrôle de rôle fin.
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/compte/:path*"],
};

import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const path = req.nextUrl.pathname;
    const role = req.nextauth.token?.role;
    const isStaff = role === "ADMIN" || role === "SUPER_ADMIN";

    // Section /admin/admins : SUPER_ADMIN uniquement.
    // On check AVANT le gate /admin général pour ne pas laisser un ADMIN
    // entrer dans /admin/admins.
    if (path.startsWith("/admin/admins") && role !== "SUPER_ADMIN") {
      // Un ADMIN authentifié qui tente /admin/admins est renvoyé sur /admin
      // (pas un 403 brut, pour ne pas casser son expérience). Un non-staff
      // est renvoyé vers /login par la règle ci-dessous.
      if (isStaff) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }

    // Section /admin/** (hors /admin/admins déjà traité) : ADMIN ou
    // SUPER_ADMIN.
    if (path.startsWith("/admin") && !isStaff) {
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

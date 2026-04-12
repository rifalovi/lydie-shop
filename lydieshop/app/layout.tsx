import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ShopChrome } from "@/components/shop/ShopChrome";
import { SessionProvider } from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: {
    default: "Lydie'shop — La boutique qui sublime les Reines",
    template: "%s · Lydie'shop",
  },
  description:
    "Perruques et tissages naturels haut de gamme. Livraison offerte dès 60€, cadeaux surprises et service premium. Bienvenue chez Lydie'shop.",
  keywords: [
    "perruque naturelle",
    "tissage",
    "lace frontal",
    "cheveux humains",
    "beauté afro",
    "lydieshop",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lydie'shop",
  },
  openGraph: {
    title: "Lydie'shop — La boutique qui sublime les Reines",
    description:
      "Perruques et tissages naturels haut de gamme. Service premium, cadeaux surprises.",
    url: "https://lydieshop.com",
    siteName: "Lydie'shop",
    locale: "fr_FR",
    type: "website",
  },
  icons: {
    icon: "/icons/icon-192x192.svg",
    apple: "/icons/icon-192x192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#F8C8D4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700&family=Raleway:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider>
          <ShopChrome>{children}</ShopChrome>
        </SessionProvider>
      </body>
    </html>
  );
}

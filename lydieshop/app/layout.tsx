import type { Metadata } from "next";
import "./globals.css";
import { ShopChrome } from "@/components/shop/ShopChrome";

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
    icon: "/favicon.ico",
  },
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
        <ShopChrome>{children}</ShopChrome>
      </body>
    </html>
  );
}

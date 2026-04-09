import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assistant SCS — OIF",
  description: "Votre assistant en Suivi-Évaluation — Organisation Internationale de la Francophonie",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}

"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import ChatWidget from "@/components/chatbot/ChatWidget";
import { BottomNav } from "@/components/pwa/BottomNav";
import { AdminBottomNav } from "@/components/pwa/AdminBottomNav";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

// Masque le header/footer/chatbot boutique sur les routes admin,
// qui ont leur propre chrome (sidebar + bottom nav admin).
export function ShopChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return (
      <>
        {children}
        <AdminBottomNav />
      </>
    );
  }

  return (
    <>
      {/* pb-16 : réserve l'espace pour la BottomNav mobile (h-16 = 64px). */}
      <div className="flex min-h-screen flex-col pb-16 md:pb-0">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <ChatWidget />
      <BottomNav />
      <InstallPrompt />
    </>
  );
}

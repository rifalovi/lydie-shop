"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { CrownIcon } from "@/components/ui/Crown";

// L'interface BeforeInstallPromptEvent n'est pas standard TypeScript.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "lydieshop-pwa-install-dismissed";
const VISIT_KEY = "lydieshop-pwa-visit-count";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Ne montre pas si déjà en mode standalone (PWA installée).
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Ne montre pas si l'utilisatrice a fermé la bannière récemment.
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const ts = Number(dismissed);
      // Re-proposer après 7 jours.
      if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Comptage des visites — afficher seulement après la 2e visite.
    const visits = Number(localStorage.getItem(VISIT_KEY) ?? "0") + 1;
    localStorage.setItem(VISIT_KEY, String(visits));
    if (visits < 2) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-[60] mx-auto max-w-md px-4 md:bottom-4">
      <div className="flex items-center gap-3 rounded-luxe border border-gold/40 bg-white p-4 shadow-lift">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-royal text-white">
          <CrownIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-ui text-sm font-bold text-ink">
            Installer Lydie&apos;shop
          </p>
          <p className="text-xs text-ink-muted">
            Accédez à la boutique directement depuis votre écran d&apos;accueil.
          </p>
        </div>
        <button
          onClick={install}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-gold px-3 py-2 text-xs font-ui font-bold text-white shadow-soft"
        >
          <Download className="h-3.5 w-3.5" />
          Installer
        </button>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-full p-1.5 text-ink-muted hover:bg-cream"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

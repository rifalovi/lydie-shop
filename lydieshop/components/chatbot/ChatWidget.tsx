"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { CrownIcon } from "@/components/ui/Crown";
import { cx } from "@/lib/format";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = [
  "Quelle perruque pour un mariage ?",
  "Comment entretenir une lace frontale ?",
  "Où en est ma commande ?",
  "Avez-vous un code promo ?",
];

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Bonjour, Reine 👑 Je suis Lydie, votre conseillère beauté. Comment puis-je sublimer votre journée aujourd'hui ?",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    // Ajoute un message assistant vide qu'on va remplir au fil du stream.
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.filter((m) => m.role !== "system"),
        }),
      });

      if (!res.ok || !res.body) throw new Error("chat-failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content:
            "Un petit souci technique de mon côté 💕 Réessayez dans un instant, ou contactez-nous sur Instagram @lydieshop.",
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Ouvrir le chat"
        className={cx(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lift transition-all hover:-translate-y-0.5",
          "bg-gradient-royal",
          open && "rotate-90",
        )}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Fenêtre */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[560px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-luxe border border-borderSoft bg-white shadow-lift">
          {/* Header */}
          <div className="flex items-center gap-3 bg-gradient-royal p-4 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <CrownIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-serif text-lg leading-tight">Lydie</p>
              <p className="flex items-center gap-1.5 text-xs text-white/85">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-300" />
                En ligne — elle vous répond
              </p>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-gradient-rose-soft p-4"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={cx(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cx(
                    "max-w-[80%] rounded-luxe px-4 py-2.5 text-sm leading-relaxed shadow-soft",
                    m.role === "user"
                      ? "bg-gradient-royal text-white"
                      : "bg-white text-ink",
                  )}
                >
                  {m.content || (loading && i === messages.length - 1 ? "…" : "")}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Loader2 className="h-3 w-3 animate-spin" />
                Lydie réfléchit...
              </div>
            )}

            {messages.length === 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-rose-dark bg-white px-3 py-1.5 text-xs font-ui font-semibold text-rose-dark transition-colors hover:bg-rose-light"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-borderSoft bg-white p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrivez votre message…"
              className="flex-1 rounded-full bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-rose"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-royal text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              aria-label="Envoyer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

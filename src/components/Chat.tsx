// src/components/Chat.tsx
import React, { useEffect, useRef, useState } from "react";
import type { ChatMsg } from "../lib/api";
import { ask } from "../lib/api";

export default function Chat() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Bonjour ! Je suis l’Assistant SCSP. Comment puis-je vous aider ?" },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const content = text.trim();
    if (!content || loading) return;

    const userMsg: ChatMsg = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setText("");
    setLoading(true);

    try {
      // Appelle l’API – attend { answer, references? }
      const data = await ask([...messages, userMsg]);

      const toAppend: ChatMsg[] = [
        { role: "assistant", content: data.answer ?? "(pas de réponse)" },
      ];

      // Ajoute un 2e message “Références” si présent
      if (data.references?.length) {
        const refsText = data.references
          .map((r) => `[${r.i}] ${r.title} — ${r.source}`)
          .join("\n");
        toAppend.push({ role: "assistant", content: `Références :\n${refsText}` });
      }

      // Un seul setMessages pour éviter les effets de bord
      setMessages((prev) => [...prev, ...toAppend]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Erreur : ${err?.message || "API indisponible"}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Entrée = envoyer ; Shift+Entrée = retour à la ligne
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="space-y-4 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-gray-100 text-right"
                : "bg-white border"
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 items-start">
        <textarea
          className="flex-1 rounded-md border px-3 py-2 min-h-[48px] max-h-48 resize-y"
          placeholder="Posez votre question… (Entrée pour envoyer, Shift+Entrée pour retour à la ligne)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
        />
        <button
          type="submit"
          className="rounded-md px-4 py-2 border"
          disabled={loading || !text.trim()}
        >
          {loading ? "…" : "Envoyer"}
        </button>
      </form>
    </div>
  );
}

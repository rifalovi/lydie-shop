// src/components/Chat.tsx
import React, { useState } from "react";
import type { ChatMsg } from "../lib/api";
import { ask } from "../lib/api";

export default function Chat() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Bonjour ! Je suis l’Assistant SCSP. Comment puis-je vous aider ?" },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const content = text.trim();
    if (!content || loading) return;

    const userMsg: ChatMsg = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setText("");
    setLoading(true);

    try {
      const data = await ask([...messages, userMsg]); // {answer, references?}
      const botMsg: ChatMsg = { role: "assistant", content: data.answer ?? "(pas de réponse)" };

      // Ajoute la réponse
      setMessages((prev) => [...prev, botMsg]);

      // Ajoute un message "Références" si présent
      if (data.references?.length) {
        const refsText = data.references
          .map((r) => `[${r.i}] ${r.title} — ${r.source}`)
          .join("\n");
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Références :\n${refsText}` },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Erreur : ${err?.message || "API indisponible"}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="space-y-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg whitespace-pre-wrap ${m.role === "user" ? "bg-gray-100 text-right" : "bg-white border"}`}>
            {m.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          className="flex-1 rounded-md border px-3 py-2"
          placeholder="Posez votre question…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="rounded-md px-4 py-2 border"
          disabled={loading}
        >
          {loading ? "…" : "Envoyer"}
        </button>
      </form>
    </div>
  );
}

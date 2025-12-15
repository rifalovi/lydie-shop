import React, { useEffect, useRef, useState } from "react";
import Message from "./Message";

export default function Chat() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Bonjour ! Je suis l’Assistant SCSP. Comment puis-je vous aider ?" },
  ]);
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim()) return;
    const next = [...messages, { role: "user", content: input }];
    setMessages(next);
    setInput("");
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next }),
    });
    const data = await res.json();
    setMessages([...next, { role: "assistant", content: data.answer || "(Pas de réponse)" }]);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[90vh]">
      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
        {messages.map((m, i) => (
          <Message key={i} role={m.role} content={m.content} />
        ))}
      </div>
      <div className="p-3 border-t bg-white">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Posez votre question sur les projets, la planification, etc."
            className="flex-1 border rounded-xl px-3 py-2"
          />
          <button onClick={send} className="px-4 py-2 rounded-xl shadow bg-gray-100">Envoyer</button>
        </div>
        <div className="text-xs opacity-60 mt-2">Les réponses peuvent citer des extraits de documents Drive indexés.</div>
      </div>
    </div>
  );
}

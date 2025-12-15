// src/lib/api.ts
export type ChatMsg = { role: "user" | "assistant"; content: string };

export type ChatResponse = {
  answer: string;
  references?: { i: number; title: string; source: string }[];
};

export async function ask(messages: ChatMsg[]): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

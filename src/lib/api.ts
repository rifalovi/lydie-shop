// src/lib/api.ts
export type ChatMsg = { role: 'user' | 'assistant'; content: string };

export async function ask(messages: ChatMsg[]): Promise<ChatMsg> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  // L’API renvoie { answer: "..." } → on retourne un message assistant
  return { role: 'assistant', content: data.answer ?? '(réponse vide)' };
}

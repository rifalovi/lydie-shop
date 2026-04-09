"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface SuggestButtonProps {
  step: number;
  field: string;
  projectData: any;
  onSuggestion: (text: string) => void;
}

export default function SuggestButton({ step, field, projectData, onSuggestion }: SuggestButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleSuggest() {
    setLoading(true);
    try {
      const res = await fetch("/api/incubation/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, field, projectData }),
      });
      const data = await res.json();
      if (data.suggestion) onSuggestion(data.suggestion);
    } catch (error) {
      console.error("Erreur suggestion IA:", error);
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleSuggest}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-xs text-oif-blue-light hover:text-oif-blue font-medium disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
      Suggérer via IA
    </button>
  );
}

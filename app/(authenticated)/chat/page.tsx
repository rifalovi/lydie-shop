"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ChatWidget from "@/components/ChatWidget";
import type { Project } from "@/lib/types";

export default function ChatPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();

  useEffect(() => {
    async function loadProjects() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (data) setProjects(data);
    }
    loadProjects();
  }, []);

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex flex-col">
      {/* Project selector */}
      <div className="bg-white border-b border-oif-gray-200 px-6 py-3 flex items-center gap-4">
        <label className="text-sm font-medium text-oif-gray-600">Contexte projet :</label>
        <select
          value={selectedProjectId || ""}
          onChange={(e) => setSelectedProjectId(e.target.value || undefined)}
          className="input-field max-w-xs"
        >
          <option value="">Aucun projet sélectionné</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code ? `[${p.code}] ` : ""}{p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Full chat */}
      <div className="flex-1 min-h-0">
        <ChatWidget
          projectId={selectedProjectId}
          floating={false}
        />
      </div>
    </div>
  );
}

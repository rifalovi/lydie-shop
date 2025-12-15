import React from "react";
export default function TopBar() {
  return (
    <div className="w-full px-4 py-3 shadow-sm sticky top-0 bg-white/80 backdrop-blur z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="text-xl font-semibold">Assistant SCSP · Chatbot</div>
        <div className="text-sm opacity-70">Accès réservé – Coordonnateurs de projet</div>
      </div>
    </div>
  );
}

import React from "react";
import Chat from "./components/Chat";
import TopBar from "./components/TopBar";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <main className="px-4">
        <Chat />
      </main>
    </div>
  );
}

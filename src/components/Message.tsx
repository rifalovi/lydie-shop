import React from "react";
export default function Message({ role, content }: { role: "user" | "assistant"; content: string }) {
  return (
    <div className={`w-full ${role === "user" ? "justify-end" : "justify-start"} flex my-2`}>
      <div className={`max-w-[80%] rounded-2xl p-3 shadow ${role === "user" ? "bg-gray-100" : "bg-white"}`}>
        <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, "<br/>") }} />
      </div>
    </div>
  );
}

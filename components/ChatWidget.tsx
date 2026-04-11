"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  ImagePlus,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string; // local preview for the user bubble
}

interface ChatWidgetProps {
  projectId?: string;
  currentStep?: number;
  floating?: boolean;
}

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is a data URL like "data:image/png;base64,XXXX"
      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ChatWidget({ projectId, currentStep, floating = true }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(!floating);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingImage, setPendingImage] = useState<{
    file: File;
    dataUrl: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so re-selecting same file works
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert("Format image non supporté. Utilisez PNG, JPG, WEBP ou GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image dépasse 5 Mo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage({ file, dataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  async function handleSend() {
    if (isStreaming) return;
    if (!input.trim() && !pendingImage) return;

    const text = input.trim() || (pendingImage ? "Analyse cette image" : "");

    const userMessage: Message = {
      role: "user",
      content: text,
      imageDataUrl: pendingImage?.dataUrl,
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Prepare payload before clearing pendingImage
    let imageBase64: string | undefined;
    let imageMediaType: string | undefined;
    if (pendingImage) {
      try {
        imageBase64 = await fileToBase64(pendingImage.file);
        imageMediaType = pendingImage.file.type;
      } catch {
        // ignore — send as text-only
      }
    }
    setPendingImage(null);

    // Add empty assistant message for streaming
    setMessages([...newMessages, { role: "assistant", content: "" }]);

    try {
      // Strip local-only fields (imageDataUrl) from the history we send
      const historyForApi = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi,
          projectId,
          currentStep,
          ...(imageBase64
            ? { imageBase64, imageMediaType, message: text }
            : {}),
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  assistantContent += parsed.text;
                  setMessages([
                    ...newMessages,
                    { role: "assistant", content: assistantContent },
                  ]);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Désolé, une erreur est survenue. Veuillez réessayer." },
      ]);
    }

    setIsStreaming(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const chatContent = (
    <div className={`flex flex-col ${floating ? "h-[500px]" : "h-full"}`}>
      {/* Header */}
      <div className="bg-oif-blue text-white px-4 py-3 flex items-center justify-between rounded-t-xl flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <div>
            <p className="text-sm font-semibold">Assistant SCS</p>
            <p className="text-[10px] text-oif-blue-100">Expert GAR/S&amp;E — OIF</p>
          </div>
        </div>
        {floating && (
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-oif-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-10 h-10 text-oif-gray-300 mx-auto mb-3" />
            <p className="text-sm text-oif-gray-400">
              Bonjour ! Je suis l&apos;Assistant SCS. Posez-moi vos questions sur la GAR, le S&amp;E, les indicateurs SMART ou l&apos;analyse ERA.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 bg-oif-blue rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-oif-blue text-white rounded-br-sm"
                  : "bg-white border border-oif-gray-200 text-oif-gray-700 rounded-bl-sm"
              }`}
            >
              {msg.imageDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={msg.imageDataUrl}
                  alt="Pièce jointe"
                  className="mb-2 rounded-md max-h-48 object-contain bg-white/10"
                />
              )}
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.role === "assistant" && !msg.content && isStreaming && (
                <Loader2 className="w-4 h-4 animate-spin text-oif-gray-400" />
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 bg-oif-blue-light rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Pending image preview */}
      {pendingImage && (
        <div className="px-3 pt-2 bg-white border-t border-oif-gray-200 flex-shrink-0">
          <div className="inline-flex items-center gap-2 bg-oif-gray-50 border border-oif-gray-200 rounded-lg p-1.5 pr-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pendingImage.dataUrl}
              alt="Aperçu"
              className="w-10 h-10 object-cover rounded-md"
            />
            <span className="text-xs text-oif-gray-500 max-w-[180px] truncate">
              {pendingImage.file.name}
            </span>
            <button
              onClick={() => setPendingImage(null)}
              className="p-1 text-oif-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
              title="Retirer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-oif-gray-200 bg-white rounded-b-xl flex-shrink-0">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            className="p-2.5 text-oif-gray-500 border border-oif-gray-200 rounded-lg hover:bg-oif-gray-50 disabled:opacity-50 transition-colors"
            title="Joindre une image"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question..."
            className="flex-1 resize-none border border-oif-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-oif-blue-light max-h-24"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !pendingImage) || isStreaming}
            className="p-2.5 bg-oif-blue text-white rounded-lg hover:bg-oif-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (!floating) {
    return chatContent;
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-oif-blue text-white rounded-full shadow-lg hover:bg-oif-blue-hover transition-all hover:scale-105 flex items-center justify-center z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[420px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-oif-gray-200 z-50">
          {chatContent}
        </div>
      )}
    </>
  );
}

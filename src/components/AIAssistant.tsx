import { useEffect, useRef, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { X, ChevronUp, MessageCircle } from "lucide-react";
import { Streamdown } from "streamdown";
import { appStore } from "#/lib/store";
import { useRecipeChat } from "#/lib/ai-hook";
import type { ChatMessages } from "#/lib/ai-hook";
import RecipeCard from "./RecipeCard";

function Messages({ messages }: { messages: ChatMessages }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-secondary-3">
        Ask me anything about your recipes!
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      {messages.map(({ id, role, parts }) => (
        <div
          key={id}
          className={`px-4 py-3 ${
            role === "assistant" ? "bg-primary-4/50" : ""
          }`}
        >
          {parts.map((part, index) => {
            if (part.type === "text" && part.content) {
              return (
                <div key={index} className="flex items-start gap-2">
                  {role === "assistant" ? (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-1 text-xs font-bold text-white">
                      AI
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary-3 text-xs font-bold text-white">
                      Y
                    </div>
                  )}
                  <div className="prose prose-sm min-w-0 flex-1 text-secondary-1">
                    <Streamdown>{part.content}</Streamdown>
                  </div>
                </div>
              );
            }
            if (part.type === "tool-call") {
              const output = part.output as { slug?: string } | undefined;
              const args = JSON.parse(part.arguments || "{}") as {
                slug?: string;
              };
              const slug = output?.slug ?? args.slug;
              if (!slug) return null;
              return (
                <div key={part.id} className="mx-auto max-w-sm py-2">
                  <RecipeCard slug={slug} compact />
                </div>
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const isOpen = useStore(appStore, (s) => s.chatOpen);
  const { messages, sendMessage } = useRecipeChat();
  const [input, setInput] = useState("");

  if (!isOpen) {
    return (
      <button
        onClick={() => appStore.setState((s) => ({ ...s, chatOpen: true }))}
        className="fixed bottom-36 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-1 text-white shadow-lg transition-transform active:scale-95 lg:bottom-6"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface-1 lg:inset-auto lg:bottom-4 lg:right-4 lg:h-[600px] lg:w-[400px] lg:rounded-2xl lg:border lg:border-border-1 lg:shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-1 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-1 text-xs font-bold text-white">
            AI
          </div>
          <h3 className="font-semibold text-secondary-1">Recipe Assistant</h3>
        </div>
        <button
          onClick={() => appStore.setState((s) => ({ ...s, chatOpen: false }))}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary-2 transition-colors active:bg-primary-4"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <Messages messages={messages} />

      {/* Input */}
      <div className="border-t border-border-1 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) {
              sendMessage(input);
              setInput("");
            }
          }}
        >
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your recipes…"
              className="w-full rounded-xl border border-border-1 bg-surface-2 py-3 pl-4 pr-12 text-base text-secondary-1 placeholder:text-secondary-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20"
              rows={1}
              style={{ minHeight: "48px", maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && input.trim()) {
                  e.preventDefault();
                  sendMessage(input);
                  setInput("");
                }
              }}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-primary-1 transition-colors disabled:text-secondary-3"
            >
              <ChevronUp size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

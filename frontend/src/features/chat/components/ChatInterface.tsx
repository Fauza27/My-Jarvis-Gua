"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, RefreshCcw, Search } from "lucide-react";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";
import { SemanticSearchPanel } from "./SemanticSearchPanel";
import { useSendChatMessage } from "../hooks";
import { useChatStore } from "../store";

type ChatPanelMode = "chat" | "search";

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<ChatPanelMode>("chat");
  const conversationHistory = useChatStore((state) => state.conversationHistory);
  const latestActions = useChatStore((state) => state.lastActionTaken);
  const clearConversation = useChatStore((state) => state.clearConversation);

  const { sendMessage, isPending, error } = useSendChatMessage();
  const listAnchorRef = useRef<HTMLDivElement>(null);

  const canSubmit = useMemo(() => Boolean(input.trim()) && !isPending, [input, isPending]);

  const handleSend = () => {
    const message = input.trim();
    if (!message || !canSubmit) {
      return;
    }

    sendMessage(message);
    setInput("");
  };

  useEffect(() => {
    listAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversationHistory, isPending]);

  return (
    <div className="flex h-[calc(100vh-5.5rem)] w-full overflow-hidden bg-background md:h-[calc(100vh-2rem)]">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card/60 p-3 md:flex md:flex-col">
        <div className="mb-2 px-2 pt-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI Workspace</p>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setActiveMode("chat")}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${activeMode === "chat" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("search")}
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${activeMode === "search" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <Search className="h-4 w-4" />
            Semantic Search
          </button>
        </div>

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={clearConversation}
            disabled={conversationHistory.length === 0 || isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Clear conversation
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border bg-card/50 p-2 md:hidden">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveMode("chat")}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${activeMode === "chat" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("search")}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${activeMode === "search" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              Search
            </button>
          </div>
        </div>

        {activeMode === "chat" ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-5">
              {error && <p className="mb-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error instanceof Error ? error.message : "Terjadi error saat mengirim pesan"}</p>}

              <ChatMessageList messages={conversationHistory} isPending={isPending} latestActions={latestActions} className="pb-6" />
              <div ref={listAnchorRef} />
            </div>
            <ChatComposer value={input} onChange={setInput} onSubmit={handleSend} disabled={isPending} />
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-5">
            <SemanticSearchPanel />
          </div>
        )}
      </div>
    </div>
  );
}

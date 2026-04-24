"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Receipt, BarChart3, PiggyBank } from "lucide-react";
import Image from "next/image";
import { ChatComposer } from "./ChatComposer";
import { ChatMessageList } from "./ChatMessageList";
import { SemanticSearchPanel } from "./SemanticSearchPanel";
import { useSendChatMessage } from "../hooks";
import { useChatStore } from "../store";

type ChatPanelMode = "chat" | "search";

const quickActions = [
  { label: "Catat Pengeluaran", icon: Receipt, prompt: "Catat pengeluaran 50rb untuk makan siang" },
  { label: "Ringkasan Keuangan", icon: BarChart3, prompt: "Berikan ringkasan keuangan bulan ini" },
  { label: "Cari Transaksi", icon: Search, prompt: "Cari pengeluaran untuk transportasi" },
  { label: "Tips Hemat", icon: PiggyBank, prompt: "Berikan tips menghemat pengeluaran" },
];

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<ChatPanelMode>("chat");
  const conversationHistory = useChatStore((state) => state.conversationHistory);
  const latestActions = useChatStore((state) => state.lastActionTaken);
  const clearConversation = useChatStore((state) => state.clearConversation);

  const { sendMessage, isPending, error } = useSendChatMessage();
  const listAnchorRef = useRef<HTMLDivElement>(null);

  const canSubmit = useMemo(() => Boolean(input.trim()) && !isPending, [input, isPending]);

  const handleSend = (message?: string) => {
    const text = (message || input).trim();
    if (!text || isPending) {
      return;
    }

    sendMessage(text);
    if (!message) {
      setInput("");
    }
  };

  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  useEffect(() => {
    listAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversationHistory, isPending]);

  const isEmpty = conversationHistory.length === 0;

  return (
    <div className="flex h-[calc(100vh-5.5rem)] w-full overflow-hidden bg-background md:h-screen">
      {/* Main chat content — full width, no internal sidebar */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile tab bar */}
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

        {/* Desktop top bar — minimal, Claude-style */}
        <div className="hidden md:flex items-center justify-between border-b border-border/30 px-6 py-2.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveMode("chat")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${activeMode === "chat" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("search")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${activeMode === "search" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Semantic Search
            </button>
          </div>
          <button
            type="button"
            onClick={clearConversation}
            disabled={conversationHistory.length === 0 || isPending}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
        </div>

        {activeMode === "chat" ? (
          <div className="flex min-h-0 flex-1 flex-col">
            {isEmpty ? (
              /* Welcome screen — Claude.ai style */
              <div className="flex flex-1 flex-col items-center justify-center px-4">
                <div className="flex flex-col items-center text-center max-w-lg">
                  <Image
                    src="/Logo-Chat.png"
                    alt="Life OS Chat"
                    width={64}
                    height={64}
                    className="mb-4 h-16 w-16 object-contain"
                  />
                  <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                    Ada yang bisa dibantu?
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                    Tanya apa saja tentang keuanganmu — catat pengeluaran, lihat ringkasan, atau cari transaksi.
                  </p>
                </div>

                {/* Quick action buttons */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  {quickActions.map(({ label, icon: Icon, prompt }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleQuickAction(prompt)}
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:bg-card hover:border-border hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Input di welcome screen */}
                <div className="mt-8 w-full max-w-2xl">
                  <ChatComposer value={input} onChange={setInput} onSubmit={() => handleSend()} disabled={isPending} />
                </div>
              </div>
            ) : (
              /* Chat messages — Claude style: no bubbles, centered, clean */
              <>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="mx-auto max-w-3xl px-4 py-5 md:px-6">
                    {error && (
                      <p className="mb-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
                        {error instanceof Error ? error.message : "Terjadi error saat mengirim pesan"}
                      </p>
                    )}

                    <ChatMessageList messages={conversationHistory} isPending={isPending} latestActions={latestActions} className="pb-4" />
                    <div ref={listAnchorRef} />
                  </div>
                </div>
                <div className="mx-auto w-full max-w-3xl">
                  <ChatComposer value={input} onChange={setInput} onSubmit={() => handleSend()} disabled={isPending} />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-5">
            <div className="mx-auto max-w-3xl">
              <SemanticSearchPanel />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

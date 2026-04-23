"use client";

import { Bot, UserRound, Wrench } from "lucide-react";
import { ConversationMessage } from "../types";

interface ChatMessageListProps {
  messages: ConversationMessage[];
  isPending: boolean;
  latestActions: string[];
  className?: string;
}

export function ChatMessageList({ messages, isPending, latestActions, className = "" }: ChatMessageListProps) {
  if (messages.length === 0) {
    return (
      <div className={`flex h-full min-h-80 items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 p-6 text-center ${className}`}>
        <div>
          <h3 className="text-base font-semibold text-foreground">Mulai percakapan</h3>
          <p className="mt-1 text-sm text-muted-foreground">Contoh: &quot;catat pengeluaran 45rb untuk makan siang&quot;</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {messages.map((message, index) => {
        const isUser = message.role === "user";

        return (
          <div key={`${message.role}-${index}-${message.content.slice(0, 20)}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-[85%] items-start gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isUser ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {isUser ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isUser ? "bg-primary text-primary-foreground rounded-tr-md" : "bg-card border border-border text-foreground rounded-tl-md"}`}>
                <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
              </div>
            </div>
          </div>
        );
      })}

      {isPending && (
        <div className="flex justify-start">
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
            <Bot className="h-4 w-4" />
            <span>AI sedang mengetik...</span>
          </div>
        </div>
      )}

      {latestActions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card/60 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Wrench className="h-3.5 w-3.5" />
            Aksi yang dijalankan AI
          </div>
          <div className="flex flex-wrap gap-2">
            {latestActions.map((action, index) => (
              <span key={`${action}-${index}`} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {action}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

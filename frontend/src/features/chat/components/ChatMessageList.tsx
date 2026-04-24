"use client";

import { Wrench } from "lucide-react";
import { ConversationMessage } from "../types";

interface ChatMessageListProps {
  messages: ConversationMessage[];
  isPending: boolean;
  latestActions: string[];
  className?: string;
}

export function ChatMessageList({ messages, isPending, latestActions, className = "" }: ChatMessageListProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {messages.map((message, index) => {
        const isUser = message.role === "user";

        return (
          <div key={`${message.role}-${index}-${message.content.slice(0, 20)}`}>
            {isUser ? (
              /* User message — Claude style: right-aligned block with subtle bg */
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-3xl rounded-br-lg bg-muted/80 px-5 py-3 text-sm leading-relaxed text-foreground">
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            ) : (
              /* AI message — Claude style: plain text, no bubble, no border */
              <div className="text-sm leading-relaxed text-foreground">
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            )}
          </div>
        );
      })}

      {isPending && (
        <div className="py-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
          </div>
        </div>
      )}

      {latestActions.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card/40 px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Wrench className="h-3.5 w-3.5" />
            Aksi yang dijalankan
          </div>
          <div className="flex flex-wrap gap-1.5">
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

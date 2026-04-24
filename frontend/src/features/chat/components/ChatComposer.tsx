"use client";

import { FormEvent, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function ChatComposer({ value, onChange, onSubmit, disabled = false }: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [value]);

  return (
    <form onSubmit={handleSubmit} className="border-t border-border/40 bg-background/95 p-3 backdrop-blur supports-backdrop-filter:bg-background/85 md:border-t-0 md:p-4 md:pt-2">
      <div className="mx-auto flex w-full items-end gap-2 rounded-2xl border border-border/60 bg-card/80 p-2 shadow-sm transition-all duration-200 focus-within:border-border focus-within:shadow-md">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanya apa saja tentang keuanganmu..."
          rows={1}
          disabled={disabled}
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Kirim pesan"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

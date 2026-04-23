"use client";

import { FormEvent } from "react";
import { Send } from "lucide-react";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function ChatComposer({ value, onChange, onSubmit, disabled = false }: ChatComposerProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="sticky bottom-0 border-t border-border bg-background/95 p-3 backdrop-blur supports-backdrop-filter:bg-background/85 md:p-4">
      <div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Tanya apa saja tentang keuanganmu..."
          rows={1}
          disabled={disabled}
          className="max-h-36 min-h-[44px] flex-1 resize-y bg-transparent px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Kirim pesan"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

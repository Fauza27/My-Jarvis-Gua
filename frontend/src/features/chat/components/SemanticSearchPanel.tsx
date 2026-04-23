"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { useSemanticSearch } from "../hooks";

export function SemanticSearchPanel() {
  const [query, setQuery] = useState("");
  const searchMutation = useSemanticSearch();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    searchMutation.mutate({ query: trimmed, threshold: 0.2, limit: 5 });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">Semantic Search</h3>
      <p className="mt-1 text-xs text-muted-foreground">Cari transaksi mirip berdasarkan makna kalimat.</p>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Contoh: makan siang minggu lalu"
          className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={searchMutation.isPending || !query.trim()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search className="h-4 w-4" />
          Cari
        </button>
      </form>

      {searchMutation.isError && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{searchMutation.error instanceof Error ? searchMutation.error.message : "Gagal melakukan pencarian"}</p>}

      {searchMutation.data && (
        <div className="mt-3 space-y-2">
          {searchMutation.data.results.length === 0 ? (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Tidak ada hasil yang cocok.</p>
          ) : (
            searchMutation.data.results.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-background px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">Rp {Number(item.amount).toLocaleString("id-ID")}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">sim: {(item.similarity * 100).toFixed(1)}%</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.type} • {item.category}
                  {item.transaction_date ? ` • ${item.transaction_date}` : ""}
                </p>
                {item.description && <p className="mt-1 text-xs text-foreground/90">{item.description}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

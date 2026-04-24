"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ExpenseForm } from "@/features/expense/components/ExpenseForm";
import { ExpenseList } from "@/features/expense/components/ExpenseList";
import { useExpenseSummaryAllTime } from "@/features/expense/hooks";
import { Plus, X, SlidersHorizontal, RotateCcw, Search } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function ExpensePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const summaryQuery = useExpenseSummaryAllTime();
  const summary = summaryQuery.data;

  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const currentPage = useMemo(() => {
    const raw = searchParams.get("page");
    const parsed = Number(raw);
    if (!raw || !Number.isInteger(parsed) || parsed < 1) {
      return 1;
    }
    return parsed;
  }, [searchParams]);

  const typeFilter = useMemo(() => {
    const raw = searchParams.get("type");
    if (raw === "income" || raw === "expense") {
      return raw;
    }
    return "all" as const;
  }, [searchParams]);

  const categoryFilter = useMemo(() => searchParams.get("category") ?? "", [searchParams]);
  const searchQuery = useMemo(() => searchParams.get("q") ?? "", [searchParams]);
  const dateFromFilter = useMemo(() => searchParams.get("date_from") ?? "", [searchParams]);
  const dateToFilter = useMemo(() => searchParams.get("date_to") ?? "", [searchParams]);
  const sortBy = useMemo(() => {
    const raw = searchParams.get("sort_by");
    if (raw === "created_at" || raw === "transaction_date" || raw === "amount") {
      return raw;
    }
    return "created_at" as const;
  }, [searchParams]);
  const sortOrder = useMemo(() => {
    const raw = searchParams.get("sort_order");
    if (raw === "asc" || raw === "desc") {
      return raw;
    }
    return "desc" as const;
  }, [searchParams]);
  const isDateRangeInvalid = Boolean(dateFromFilter && dateToFilter && dateFromFilter > dateToFilter);

  const [categoryInput, setCategoryInput] = useState(categoryFilter);
  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setCategoryInput(categoryFilter);
  }, [categoryFilter]);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const handlePageChange = (nextPage: number) => {
    updateSearchParams({
      page: nextPage <= 1 ? null : String(nextPage),
    });
  };

  const handleTypeFilterChange = (value: "all" | "income" | "expense") => {
    updateSearchParams({
      type: value === "all" ? null : value,
      page: null,
    });
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryInput(value);
  };

  const handleSearchQueryChange = (value: string) => {
    setSearchInput(value);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const nextValue = categoryInput.trim();
      const currentValue = categoryFilter.trim();
      if (nextValue === currentValue) return;
      updateSearchParams({ category: nextValue ? nextValue : null, page: null });
    }, 450);
    return () => clearTimeout(timeoutId);
  }, [categoryInput, categoryFilter, updateSearchParams]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const nextValue = searchInput.trim();
      const currentValue = searchQuery.trim();
      if (nextValue === currentValue) return;
      updateSearchParams({ q: nextValue ? nextValue : null, page: null });
    }, 450);
    return () => clearTimeout(timeoutId);
  }, [searchInput, searchQuery, updateSearchParams]);

  const handleImmediateCategoryClear = () => {
    updateSearchParams({ category: null, page: null });
  };

  const handleImmediateSearchClear = () => {
    updateSearchParams({ q: null, page: null });
  };

  const handleDateFromChange = (value: string) => {
    updateSearchParams({ date_from: value || null, page: null });
  };

  const handleDateToChange = (value: string) => {
    updateSearchParams({ date_to: value || null, page: null });
  };

  const handleSortByChange = (value: "created_at" | "transaction_date" | "amount") => {
    updateSearchParams({ sort_by: value === "created_at" ? null : value, page: null });
  };

  const handleSortOrderChange = (value: "asc" | "desc") => {
    updateSearchParams({ sort_order: value === "desc" ? null : value, page: null });
  };

  const handleResetFilters = () => {
    updateSearchParams({
      type: null,
      category: null,
      q: null,
      date_from: null,
      date_to: null,
      sort_by: null,
      sort_order: null,
      page: null,
    });
  };

  const hasActiveFilters = typeFilter !== "all" || categoryFilter || searchQuery || dateFromFilter || dateToFilter || sortBy !== "created_at" || sortOrder !== "desc";

  const netBalance = summary?.net_balance ?? 0;

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        {/* ── Header ── */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight md:text-4xl">
            Financial<br className="sm:hidden" />{" "}
            <span className="text-primary">Operations</span>
          </h1>
        </div>

        {/* ── Summary row ── */}
        {!summaryQuery.isLoading && !summaryQuery.isError && (
          <div className="mb-6 grid grid-cols-3 gap-3 md:gap-4">
            <div className="rounded-2xl bg-muted/30 p-3.5 md:p-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Income</p>
              <p className="text-base font-bold text-foreground tabular-nums md:text-lg">
                {currencyFormatter.format(summary?.total_income ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/30 p-3.5 md:p-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Expense</p>
              <p className="text-base font-bold text-foreground tabular-nums md:text-lg">
                {currencyFormatter.format(summary?.total_expense ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-primary/8 p-3.5 md:p-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Balance</p>
              <p className={`text-base font-bold tabular-nums md:text-lg ${netBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {netBalance < 0 ? "−" : ""}{currencyFormatter.format(Math.abs(netBalance))}
              </p>
            </div>
          </div>
        )}

        {summaryQuery.isLoading && (
          <div className="mb-6 grid grid-cols-3 gap-3 md:gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-muted/20 p-4">
                <div className="h-2.5 w-12 animate-pulse rounded bg-muted/40 mb-2" />
                <div className="h-5 w-24 animate-pulse rounded bg-muted/40" />
              </div>
            ))}
          </div>
        )}

        {summaryQuery.isError && (
          <p className="mb-6 text-sm text-destructive">
            {summaryQuery.error instanceof Error ? summaryQuery.error.message : "Gagal memuat ringkasan"}
          </p>
        )}

        {/* ── Toolbar ── */}
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={searchInput}
              onChange={(e) => {
                handleSearchQueryChange(e.target.value);
                if (e.target.value === "") handleImmediateSearchClear();
              }}
              placeholder="Cari transaksi..."
              className="h-10 w-full rounded-xl border border-border/40 bg-muted/20 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-background focus:border-border transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(""); handleImmediateSearchClear(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
              showFilters || hasActiveFilters
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border/40 bg-muted/20 text-muted-foreground hover:text-foreground"
            }`}
            title="Filter"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-80 active:opacity-70"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <div className="mb-5 rounded-2xl bg-muted/15 p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipe</label>
                <div className="flex h-9 rounded-lg bg-muted/30 p-0.5 overflow-hidden">
                  {(["all", "income", "expense"] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleTypeFilterChange(val)}
                      className={`flex-1 rounded-md text-xs font-medium transition-all ${
                        typeFilter === val
                          ? "bg-foreground text-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {val === "all" ? "All" : val === "income" ? "In" : "Out"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Kategori</label>
                <input
                  value={categoryInput}
                  onChange={(e) => {
                    handleCategoryFilterChange(e.target.value);
                    if (e.target.value === "") handleImmediateCategoryClear();
                  }}
                  placeholder="food, transport..."
                  className="h-9 w-full rounded-lg bg-muted/30 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring/30 transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dari</label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="h-9 w-full rounded-lg bg-muted/30 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring/30 transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sampai</label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="h-9 w-full rounded-lg bg-muted/30 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring/30 transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Urutkan</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortByChange(e.target.value as any)}
                  className="h-9 w-full rounded-lg bg-muted/30 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring/30 transition-all"
                >
                  <option value="created_at">Dibuat</option>
                  <option value="transaction_date">Tanggal</option>
                  <option value="amount">Jumlah</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Arah</label>
                <select
                  value={sortOrder}
                  onChange={(e) => handleSortOrderChange(e.target.value as any)}
                  className="h-9 w-full rounded-lg bg-muted/30 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring/30 transition-all"
                >
                  <option value="desc">Terbaru</option>
                  <option value="asc">Terlama</option>
                </select>
              </div>
            </div>

            {isDateRangeInvalid && (
              <p className="mt-2 text-xs text-destructive">Rentang tanggal tidak valid.</p>
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset filter
              </button>
            )}
          </div>
        )}

        {/* ── Transaction List ── */}
        <ExpenseList
          limit={10}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          typeFilter={typeFilter}
          categoryFilter={categoryFilter}
          searchQuery={searchQuery}
          dateFrom={isDateRangeInvalid ? "" : dateFromFilter}
          dateTo={isDateRangeInvalid ? "" : dateToFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      </div>

      {/* ── Form Overlay ── */}
      {showForm && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div
            className="relative w-full sm:max-w-lg lg:max-w-2xl bg-background border-t border-border sm:border sm:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background pt-3 pb-2 px-6 border-b border-border/50 rounded-t-3xl sm:rounded-t-2xl z-10">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3 sm:hidden" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Tambah Transaksi</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 pt-4">
              <ExpenseForm compact onSuccess={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ExpenseForm } from "@/features/expense/components/ExpenseForm";
import { ExpenseList } from "@/features/expense/components/ExpenseList";
import { useExpenseSummaryAllTime } from "@/features/expense/hooks";
import { ArrowLeft, TrendingUp, TrendingDown, Scale, Plus, X } from "lucide-react";

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

  // ── Form Overlay State ──
  const [showForm, setShowForm] = useState(false);

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
      type: null, category: null, q: null, date_from: null, date_to: null,
      sort_by: null, sort_order: null, page: null,
    });
  };

  const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <>
      <div className="p-4 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Expense Tracker</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Kelola pemasukan dan pengeluaran kamu.</p>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
        </div>

        {/* Summary Cards */}
        {summaryQuery.isLoading && (
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Memuat ringkasan...</p>
          </div>
        )}

        {summaryQuery.isError && (
          <div className="bg-card rounded-2xl border border-destructive/30 p-4">
            <p className="text-sm text-destructive">{summaryQuery.error instanceof Error ? summaryQuery.error.message : "Gagal memuat ringkasan"}</p>
          </div>
        )}

        {!summaryQuery.isLoading && !summaryQuery.isError && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-2xl border border-border p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Income</p>
              </div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">{currencyFormatter.format(summary?.total_income ?? 0)}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Expense</p>
              </div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">{currencyFormatter.format(summary?.total_expense ?? 0)}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Scale className="w-3.5 h-3.5 text-primary" />
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Balance</p>
              </div>
              <p className="text-sm font-semibold text-primary">{currencyFormatter.format(summary?.net_balance ?? 0)}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Filter Transaksi</h2>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tipe</label>
              <select value={typeFilter} onChange={(e) => handleTypeFilterChange(e.target.value as any)} className={inputClass}>
                <option value="all">Semua</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Kategori</label>
              <input value={categoryInput} onChange={(e) => { handleCategoryFilterChange(e.target.value); if (e.target.value === "") handleImmediateCategoryClear(); }} placeholder="contoh: food" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Cari</label>
              <input value={searchInput} onChange={(e) => { handleSearchQueryChange(e.target.value); if (e.target.value === "") handleImmediateSearchClear(); }} placeholder="deskripsi, kategori" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Dari Tanggal</label>
              <input type="date" value={dateFromFilter} onChange={(e) => handleDateFromChange(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Sampai Tanggal</label>
              <input type="date" value={dateToFilter} onChange={(e) => handleDateToChange(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Urutkan</label>
              <select value={sortBy} onChange={(e) => handleSortByChange(e.target.value as any)} className={inputClass}>
                <option value="created_at">Waktu Dibuat</option>
                <option value="transaction_date">Tgl Transaksi</option>
                <option value="amount">Jumlah</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Arah</label>
              <select value={sortOrder} onChange={(e) => handleSortOrderChange(e.target.value as any)} className={inputClass}>
                <option value="desc">Terbaru</option>
                <option value="asc">Terlama</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Filter berlaku ke seluruh data.</p>
              {isDateRangeInvalid && <p className="text-xs text-destructive mt-1">Rentang tanggal tidak valid.</p>}
            </div>
            <button type="button" onClick={handleResetFilters} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              Reset Filter
            </button>
          </div>
        </div>

        {/* Transaction List */}
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

      {/* ── FAB (Floating Action Button) ── */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="
            fixed z-[55] bottom-20 right-4
            w-14 h-14 rounded-2xl
            bg-primary text-primary-foreground
            shadow-lg hover:shadow-xl
            flex items-center justify-center
            hover:bg-primary/90 active:scale-95
            transition-all duration-200
          "
          title="Tambah Transaksi"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* ── Form Overlay ── */}
      {showForm && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
          onClick={() => setShowForm(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Form Container */}
          <div
            className="
              relative w-full sm:max-w-lg
              bg-background border-t border-border sm:border sm:rounded-2xl
              rounded-t-3xl
              max-h-[85vh] overflow-y-auto
              animate-in slide-in-from-bottom-4 duration-300
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar (mobile) */}
            <div className="sticky top-0 bg-background pt-3 pb-2 px-6 border-b border-border/50 rounded-t-3xl sm:rounded-t-2xl z-10">
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3 sm:hidden" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Tambah Transaksi</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 pt-4">
              <ExpenseForm compact onSuccess={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

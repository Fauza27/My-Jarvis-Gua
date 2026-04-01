"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ExpenseForm } from "@/features/expense/components/ExpenseForm";
import { ExpenseList } from "@/features/expense/components/ExpenseList";
import { useExpenseSummaryAllTime } from "@/features/expense/hooks";

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

  // Ambil halaman aktif dari query parameter URL (?page=...).
  // Jika param tidak valid, fallback ke halaman 1.
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

  // Input state lokal untuk field yang diketik bebas.
  // URL akan diupdate dengan debounce agar tidak berubah pada setiap huruf.
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

  // Saat user pindah halaman, kita update URL tanpa full reload.
  // Ini membuat state pagination tetap bertahan saat refresh/share link.
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

      if (nextValue === currentValue) {
        return;
      }

      updateSearchParams({
        category: nextValue ? nextValue : null,
        page: null,
      });
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [categoryInput, categoryFilter, updateSearchParams]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const nextValue = searchInput.trim();
      const currentValue = searchQuery.trim();

      if (nextValue === currentValue) {
        return;
      }

      updateSearchParams({
        q: nextValue ? nextValue : null,
        page: null,
      });
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [searchInput, searchQuery, updateSearchParams]);

  const handleImmediateCategoryClear = () => {
    updateSearchParams({
      category: null,
      page: null,
    });
  };

  const handleImmediateSearchClear = () => {
    updateSearchParams({
      q: null,
      page: null,
    });
  };

  const handleDateFromChange = (value: string) => {
    updateSearchParams({
      date_from: value || null,
      page: null,
    });
  };

  const handleDateToChange = (value: string) => {
    updateSearchParams({
      date_to: value || null,
      page: null,
    });
  };

  const handleSortByChange = (value: "created_at" | "transaction_date" | "amount") => {
    updateSearchParams({
      sort_by: value === "created_at" ? null : value,
      page: null,
    });
  };

  const handleSortOrderChange = (value: "asc" | "desc") => {
    updateSearchParams({
      sort_order: value === "desc" ? null : value,
      page: null,
    });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
          <p className="text-sm text-gray-600 mt-1">Kelola pemasukan dan pengeluaran kamu dari satu halaman.</p>
        </div>
        <Link href="/dashboard" className="text-sm text-blue-700 hover:text-blue-800 hover:underline">
          Kembali ke Dashboard
        </Link>
      </div>

      {summaryQuery.isLoading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Memuat ringkasan...</p>
        </div>
      )}

      {summaryQuery.isError && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
          <p className="text-sm text-red-700">{summaryQuery.error instanceof Error ? summaryQuery.error.message : "Gagal memuat ringkasan"}</p>
        </div>
      )}

      {!summaryQuery.isLoading && !summaryQuery.isError && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total Income</p>
            <p className="text-xl font-semibold text-green-700 mt-1">{currencyFormatter.format(summary?.total_income ?? 0)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total Expense</p>
            <p className="text-xl font-semibold text-red-700 mt-1">{currencyFormatter.format(summary?.total_expense ?? 0)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Net Balance</p>
            <p className="text-xl font-semibold text-blue-700 mt-1">{currencyFormatter.format(summary?.net_balance ?? 0)}</p>
          </div>
        </div>
      )}

      <ExpenseForm />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Filter Transaksi</h2>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tipe</label>
            <select
              value={typeFilter}
              onChange={(event) => handleTypeFilterChange(event.target.value as "all" | "income" | "expense")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Kategori</label>
            <input
              value={categoryInput}
              onChange={(event) => {
                const value = event.target.value;
                handleCategoryFilterChange(value);
                if (value === "") handleImmediateCategoryClear();
              }}
              placeholder="contoh: food"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cari</label>
            <input
              value={searchInput}
              onChange={(event) => {
                const value = event.target.value;
                handleSearchQueryChange(value);
                if (value === "") handleImmediateSearchClear();
              }}
              placeholder="deskripsi, kategori, subkategori"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(event) => handleDateFromChange(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sampai Tanggal</label>
            <input type="date" value={dateToFilter} onChange={(event) => handleDateToChange(event.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Urutkan Berdasarkan</label>
            <select
              value={sortBy}
              onChange={(event) => handleSortByChange(event.target.value as "created_at" | "transaction_date" | "amount")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at">Waktu Dibuat</option>
              <option value="transaction_date">Tanggal Transaksi</option>
              <option value="amount">Jumlah</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Arah Urutan</label>
            <select
              value={sortOrder}
              onChange={(event) => handleSortOrderChange(event.target.value as "asc" | "desc")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Terbaru / Terbesar</option>
              <option value="asc">Terlama / Terkecil</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Filter diterapkan di server, jadi berlaku ke seluruh data kamu.</p>
            {isDateRangeInvalid && <p className="text-xs text-red-600 mt-1">Rentang tanggal tidak valid. Tanggal awal harus lebih kecil atau sama dengan tanggal akhir.</p>}
          </div>
          <button type="button" onClick={handleResetFilters} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
            Reset Filter
          </button>
        </div>
      </div>

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
  );
}

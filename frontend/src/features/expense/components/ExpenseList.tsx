"use client";

import { Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useDeleteExpense, useExpenses } from "../hooks";
import { Expense } from "../types";
import { ExpenseEditForm } from "./ExpenseEditForm";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

type ExpenseListProps = {
  limit?: number;
  initialPage?: number;
  currentPage?: number;
  onPageChange?: (nextPage: number) => void;
  typeFilter?: "all" | "income" | "expense";
  categoryFilter?: string;
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "created_at" | "transaction_date" | "amount";
  sortOrder?: "asc" | "desc";
};

// Category → warm color mapping for avatar circles
const categoryColors: Record<string, { bg: string; text: string }> = {
  food: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  makanan: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  transport: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  transportasi: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  shopping: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-400" },
  belanja: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-400" },
  entertainment: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400" },
  hiburan: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400" },
  health: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  kesehatan: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  salary: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  gaji: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  bills: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
  tagihan: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400" },
  education: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400" },
  pendidikan: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400" },
};

const fallbackColors = [
  { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400" },
  { bg: "bg-sky-100 dark:bg-sky-900/30", text: "text-sky-700 dark:text-sky-400" },
  { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-400" },
  { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400" },
];

function getCategoryColor(category: string) {
  const key = category.toLowerCase().trim();
  if (categoryColors[key]) return categoryColors[key];
  // Hash-based fallback for consistent color per category
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  return fallbackColors[Math.abs(hash) % fallbackColors.length];
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;

  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function ExpenseItem({ item, onDelete, onEdit, isDeleting }: { item: Expense; onDelete: (id: string) => void; onEdit: (item: Expense) => void; isDeleting: boolean }) {
  const isIncome = item.type === "income";
  const color = getCategoryColor(item.category);

  return (
    <div className="group flex items-center gap-3.5 py-3 px-2 transition-colors hover:bg-muted/20 rounded-xl -mx-2">
      {/* Category avatar */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${color.bg} ${color.text}`}>
        {item.category?.charAt(0)?.toUpperCase() || "?"}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {item.description || item.category}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {item.transaction_date ? formatDate(item.transaction_date) : item.category}
        </p>
      </div>

      {/* Amount */}
      <p className={`shrink-0 text-sm font-semibold tabular-nums ${
        isIncome ? "text-green-600 dark:text-green-400" : "text-foreground"
      }`}>
        {isIncome ? "+" : "−"}{currencyFormatter.format(item.amount)}
      </p>

      {/* Actions — appear on hover */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
          title="Edit"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          disabled={isDeleting}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
          title="Hapus"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function ExpenseList({
  limit = 10,
  initialPage = 1,
  currentPage: controlledPage,
  onPageChange,
  typeFilter = "all",
  categoryFilter = "",
  searchQuery = "",
  dateFrom = "",
  dateTo = "",
  sortBy = "created_at",
  sortOrder = "desc",
}: ExpenseListProps) {
  // Support dua mode:
  // 1) controlled mode: currentPage dikendalikan parent (untuk sinkronisasi URL)
  // 2) uncontrolled mode: fallback ke state lokal (legacy behavior)
  const [internalPage, setInternalPage] = useState(initialPage);
  const currentPage = controlledPage ?? internalPage;

  const setPage = (nextPage: number) => {
    if (onPageChange) {
      onPageChange(nextPage);
      return;
    }
    setInternalPage(nextPage);
  };

  const offset = (currentPage - 1) * limit;

  const expensesQuery = useExpenses({
    limit,
    offset,
    filters: {
      type: typeFilter === "all" ? undefined : typeFilter,
      category: categoryFilter,
      q: searchQuery,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    },
  });
  const deleteExpenseMutation = useDeleteExpense();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const totalData = expensesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalData / limit));
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const items = useMemo(() => expensesQuery.data?.expenses ?? [], [expensesQuery.data?.expenses]);

  const handleDelete = async (expenseId: string) => {
    const isConfirmed = window.confirm("Yakin ingin menghapus transaksi ini?");
    if (!isConfirmed) return;

    await deleteExpenseMutation.mutateAsync(expenseId);

    // Jika item yang dihapus adalah item terakhir di halaman ini,
    // geser ke halaman sebelumnya agar user tidak berhenti di halaman kosong.
    if (items.length === 1 && currentPage > 1) {
      setPage(Math.max(1, currentPage - 1));
    }
  };

  if (expensesQuery.isLoading) {
    return (
      <div className="space-y-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3.5 py-3 px-2">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted/40" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/5 animate-pulse rounded-md bg-muted/40" />
              <div className="h-2.5 w-1/4 animate-pulse rounded-md bg-muted/30" />
            </div>
            <div className="h-3.5 w-20 animate-pulse rounded-md bg-muted/40" />
          </div>
        ))}
      </div>
    );
  }

  if (expensesQuery.isError) {
    return (
      <p className="py-8 text-center text-sm text-destructive">
        {expensesQuery.error instanceof Error ? expensesQuery.error.message : "Gagal memuat transaksi"}
      </p>
    );
  }

  return (
    <div>
      {deleteExpenseMutation.isError && (
        <p className="mb-3 text-sm text-destructive">
          {deleteExpenseMutation.error instanceof Error ? deleteExpenseMutation.error.message : "Gagal menghapus transaksi"}
        </p>
      )}

      {editingExpense && (
        <div className="mb-4">
          <ExpenseEditForm expense={editingExpense} onCancel={() => setEditingExpense(null)} onSuccess={() => setEditingExpense(null)} />
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/40">
            <span className="text-lg">💰</span>
          </div>
          <p className="text-sm font-medium text-foreground">Belum ada transaksi</p>
          <p className="mt-1 text-xs text-muted-foreground">Transaksi yang kamu buat akan muncul di sini</p>
        </div>
      ) : (
        <>
          {/* Section header */}
          <div className="mb-1 px-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {totalData} Transaksi
              {expensesQuery.isFetching && <span className="ml-2 animate-pulse lowercase">· memperbarui</span>}
            </p>
          </div>

          {/* Items */}
          <div>
            {items.map((item) => (
              <ExpenseItem key={item.id} item={item} onDelete={handleDelete} onEdit={setEditingExpense} isDeleting={deleteExpenseMutation.isPending} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={!canGoPrev || expensesQuery.isFetching}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-20"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[3rem] text-center text-xs font-medium text-muted-foreground tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={!canGoNext || expensesQuery.isFetching}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-20"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

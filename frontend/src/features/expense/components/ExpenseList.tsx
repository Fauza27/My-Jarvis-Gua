"use client";

import { Pencil, Trash2, ChevronLeft, ChevronRight, Utensils, Car, ShoppingBag, Clapperboard, HeartPulse, Wallet, FileText, GraduationCap, CircleDollarSign } from "lucide-react";
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

function getCategoryIcon(category: string) {
  if (!category) return CircleDollarSign;
  const key = category.toLowerCase().trim();
  if (["food", "makanan"].includes(key)) return Utensils;
  if (["transport", "transportasi"].includes(key)) return Car;
  if (["shopping", "belanja"].includes(key)) return ShoppingBag;
  if (["entertainment", "hiburan"].includes(key)) return Clapperboard;
  if (["health", "kesehatan"].includes(key)) return HeartPulse;
  if (["salary", "gaji"].includes(key)) return Wallet;
  if (["bills", "tagihan"].includes(key)) return FileText;
  if (["education", "pendidikan"].includes(key)) return GraduationCap;
  return CircleDollarSign;
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
  const IconComponent = getCategoryIcon(item.category);

  return (
    <div className="group flex items-center gap-4 py-3.5 px-3 transition-colors hover:bg-muted/30 border-b border-border/40 last:border-0">
      {/* Category avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground border border-border/50 shadow-sm">
        <IconComponent className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {item.description || item.category}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 font-medium">
          {item.transaction_date ? formatDate(item.transaction_date) : item.category}
        </p>
      </div>

      {/* Amount & Actions Container */}
      <div className="flex shrink-0 items-center gap-3">
        <p className={`text-sm font-bold tabular-nums tracking-tight ${
          isIncome ? "text-success" : "text-foreground"
        }`}>
          {isIncome ? "+" : "−"}{currencyFormatter.format(item.amount)}
        </p>

        {/* Actions — appear on hover */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
            title="Hapus"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
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
          <div key={i} className="flex items-center gap-4 py-3.5 px-3 border-b border-border/30 last:border-0">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-muted/40" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/5 animate-pulse rounded-md bg-muted/40" />
              <div className="h-2.5 w-1/4 animate-pulse rounded-md bg-muted/30" />
            </div>
            <div className="h-4 w-20 animate-pulse rounded-md bg-muted/40" />
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

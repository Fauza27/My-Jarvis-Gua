"use client";

import { Pencil, Trash2 } from "lucide-react";
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

function ExpenseRow({ item, onDelete, onEdit, isDeleting }: { item: Expense; onDelete: (id: string) => void; onEdit: (item: Expense) => void; isDeleting: boolean }) {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-4 py-3 text-sm text-gray-900">{item.transaction_date || "-"}</td>
      <td className="px-4 py-3 text-sm text-gray-900 capitalize">{item.type}</td>
      <td className="px-4 py-3 text-sm text-gray-900">{item.category}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{item.description || "-"}</td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{currencyFormatter.format(item.amount)}</td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-2">
          <button type="button" onClick={() => onEdit(item)} className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50">
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button type="button" onClick={() => onDelete(item.id)} disabled={isDeleting} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60">
            <Trash2 className="w-3.5 h-3.5" />
            Hapus
          </button>
        </div>
      </td>
    </tr>
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

  const pageInfo = useMemo(() => {
    if (totalData === 0) {
      return "Menampilkan 0 dari 0 data";
    }

    const start = offset + 1;
    const end = Math.min(offset + items.length, totalData);
    return `Menampilkan ${start}-${end} dari ${totalData} data`;
  }, [offset, items.length, totalData]);

  if (expensesQuery.isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-sm text-gray-600">Memuat data transaksi...</p>
      </div>
    );
  }

  if (expensesQuery.isError) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <p className="text-sm text-red-700">{expensesQuery.error instanceof Error ? expensesQuery.error.message : "Gagal memuat transaksi"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Daftar Transaksi</h2>
        <p className="text-sm text-gray-600">{pageInfo}</p>
      </div>

      {deleteExpenseMutation.isError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{deleteExpenseMutation.error instanceof Error ? deleteExpenseMutation.error.message : "Gagal menghapus transaksi"}</div>
      )}

      {editingExpense && (
        <div className="mb-4">
          <ExpenseEditForm expense={editingExpense} onCancel={() => setEditingExpense(null)} onSuccess={() => setEditingExpense(null)} />
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">Belum ada transaksi yang cocok dengan filter saat ini.</div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Tanggal</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Tipe</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Kategori</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Deskripsi</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 text-right">Jumlah</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <ExpenseRow key={item.id} item={item} onDelete={handleDelete} onEdit={setEditingExpense} isDeleting={deleteExpenseMutation.isPending} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Halaman {currentPage} dari {totalPages}
              {expensesQuery.isFetching ? " (memperbarui...)" : ""}
            </p>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={!canGoPrev || expensesQuery.isFetching}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={!canGoNext || expensesQuery.isFetching}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

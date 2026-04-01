"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useUpdateExpense } from "../hooks";
import { Expense, UpdateExpenseInput } from "../types";
import { updateExpenseSchema } from "../validations/expenseSchema";

type ExpenseEditFormProps = {
  expense: Expense;
  onCancel: () => void;
  onSuccess?: () => void;
};

export function ExpenseEditForm({ expense, onCancel, onSuccess }: ExpenseEditFormProps) {
  const updateExpenseMutation = useUpdateExpense();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateExpenseInput>({
    resolver: zodResolver(updateExpenseSchema),
    defaultValues: {
      amount: expense.amount,
      type: expense.type,
      description: expense.description || "",
      category: expense.category,
      subcategory: expense.subcategory || "",
      payment_method: expense.payment_method || "",
      transaction_date: expense.transaction_date || "",
    },
  });

  // Saat user memilih baris lain untuk diedit, isi form harus ikut berubah.
  useEffect(() => {
    reset({
      amount: expense.amount,
      type: expense.type,
      description: expense.description || "",
      category: expense.category,
      subcategory: expense.subcategory || "",
      payment_method: expense.payment_method || "",
      transaction_date: expense.transaction_date || "",
    });
  }, [expense, reset]);

  const onSubmit = async (values: UpdateExpenseInput) => {
    const payload: UpdateExpenseInput = {
      ...values,
      description: values.description || undefined,
      subcategory: values.subcategory || undefined,
      payment_method: values.payment_method || undefined,
      transaction_date: values.transaction_date || undefined,
    };

    await updateExpenseMutation.mutateAsync({ expenseId: expense.id, payload });
    onSuccess?.();
  };

  const isLoading = isSubmitting || updateExpenseMutation.isPending;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-blue-900">Edit Transaksi</h3>
        <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900">
          <X className="w-3.5 h-3.5" />
          Tutup
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Jumlah</label>
          <input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.amount && <p className="text-xs text-red-600 mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tipe</label>
          <select {...register("type")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Kategori</label>
          <input type="text" {...register("category")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Subkategori</label>
          <input type="text" {...register("subcategory")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.subcategory && <p className="text-xs text-red-600 mt-1">{errors.subcategory.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Metode Pembayaran</label>
          <input type="text" {...register("payment_method")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.payment_method && <p className="text-xs text-red-600 mt-1">{errors.payment_method.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Transaksi</label>
          <input type="date" {...register("transaction_date")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.transaction_date && <p className="text-xs text-red-600 mt-1">{errors.transaction_date.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea rows={2} {...register("description")} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
        </div>

        {updateExpenseMutation.isError && (
          <div className="md:col-span-2 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">{updateExpenseMutation.error instanceof Error ? updateExpenseMutation.error.message : "Gagal memperbarui transaksi"}</div>
        )}

        <div className="md:col-span-2 flex items-center gap-2">
          <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60">
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
          <button type="button" onClick={onCancel} className="rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}

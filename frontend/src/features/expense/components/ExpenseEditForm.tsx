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

  const inputClass = "h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all";

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Edit Transaksi</h3>
        <button type="button" onClick={onCancel} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Jumlah</label>
          <input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} className={inputClass} />
          {errors.amount && <p className="mt-1 text-xs text-destructive">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipe</label>
          <select {...register("type")} className={inputClass}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          {errors.type && <p className="mt-1 text-xs text-destructive">{errors.type.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Kategori</label>
          <input type="text" {...register("category")} className={inputClass} />
          {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Subkategori</label>
          <input type="text" {...register("subcategory")} className={inputClass} />
          {errors.subcategory && <p className="mt-1 text-xs text-destructive">{errors.subcategory.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Metode Pembayaran</label>
          <input type="text" {...register("payment_method")} className={inputClass} />
          {errors.payment_method && <p className="mt-1 text-xs text-destructive">{errors.payment_method.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Tanggal Transaksi</label>
          <input type="date" {...register("transaction_date")} className={inputClass} />
          {errors.transaction_date && <p className="mt-1 text-xs text-destructive">{errors.transaction_date.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Deskripsi</label>
          <textarea rows={2} {...register("description")} className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all" />
          {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
        </div>

        {updateExpenseMutation.isError && (
          <div className="md:col-span-2 rounded-lg bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {updateExpenseMutation.error instanceof Error ? updateExpenseMutation.error.message : "Gagal memperbarui transaksi"}
          </div>
        )}

        <div className="md:col-span-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isLoading ? "Menyimpan..." : "Simpan"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}

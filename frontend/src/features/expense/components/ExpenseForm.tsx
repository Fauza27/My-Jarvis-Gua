"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRef } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import { CreateExpenseInput } from "../types";
import { createExpenseSchema } from "../validations/expenseSchema";
import { useCreateExpense } from "../hooks";
import { getLocalDate } from "@/lib/device-time";

type ExpenseFormProps = {
  onSuccess?: () => void;
  /** When true, renders without the card wrapper/heading (for use inside modals) */
  compact?: boolean;
};

export function ExpenseForm({ onSuccess, compact = false }: ExpenseFormProps) {
  const createExpenseMutation = useCreateExpense();
  const operationRef = useRef<{ payload: string; id: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      amount: 0,
      type: "expense",
      category: "",
      description: "",
      subcategory: "",
      payment_method: "",
      transaction_date: getLocalDate(),
    },
  });

  // Form ini sengaja sederhana untuk MVP.
  // Fokus utamanya adalah memastikan alur create expense end-to-end sudah stabil.
  const onSubmit = async (values: CreateExpenseInput) => {
    const payload: CreateExpenseInput = {
      ...values,
      // Jika user mengosongkan field opsional, kirim undefined agar payload tetap bersih.
      description: values.description || undefined,
      subcategory: values.subcategory || undefined,
      payment_method: values.payment_method || undefined,
      transaction_date: values.transaction_date || getLocalDate(),
    };

    const serializedPayload = JSON.stringify(payload);
    if (operationRef.current?.payload !== serializedPayload) {
      operationRef.current = {
        payload: serializedPayload,
        id: crypto.randomUUID(),
      };
    }
    await createExpenseMutation.mutateAsync({
      payload,
      operationId: operationRef.current.id,
    });
    operationRef.current = null;

    reset({
      amount: 0,
      type: "expense",
      category: "",
      description: "",
      subcategory: "",
      payment_method: "",
      transaction_date: getLocalDate(),
    });

    onSuccess?.();
  };

  const isLoading = isSubmitting || createExpenseMutation.isPending;

  const inputClass =
    "h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all";

  return (
    <div
      className={
        compact ? "" : "rounded-xl border border-border/40 bg-card/30 p-5"
      }
    >
      {!compact && (
        <h2 className="text-base font-semibold text-foreground mb-4">
          Tambah Transaksi
        </h2>
      )}

      <form
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event).catch(() => undefined);
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Jumlah
          </label>
          <div className="flex rounded-lg border border-border/60 overflow-hidden focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-ring transition-all">
            <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted/30 border-r border-border/60">
              Rp
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              {...register("amount", { valueAsNumber: true })}
              aria-label="Jumlah"
              placeholder="0"
              className="h-9 w-full px-3 text-sm bg-background text-foreground focus:outline-none"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-xs text-destructive">
              {errors.amount.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Tipe
          </label>
          <select
            {...register("type")}
            aria-label="Tipe"
            className={inputClass}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-xs text-destructive">
              {errors.type.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Kategori
          </label>
          <input
            type="text"
            placeholder="contoh: food"
            {...register("category")}
            aria-label="Kategori"
            className={inputClass}
          />
          {errors.category && (
            <p className="mt-1 text-xs text-destructive">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Subkategori
          </label>
          <input
            type="text"
            placeholder="opsional"
            {...register("subcategory")}
            aria-label="Subkategori"
            className={inputClass}
          />
          {errors.subcategory && (
            <p className="mt-1 text-xs text-destructive">
              {errors.subcategory.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Metode Pembayaran
          </label>
          <input
            type="text"
            placeholder="opsional"
            {...register("payment_method")}
            aria-label="Metode Pembayaran"
            className={inputClass}
          />
          {errors.payment_method && (
            <p className="mt-1 text-xs text-destructive">
              {errors.payment_method.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Tanggal Transaksi
          </label>
          <input
            type="date"
            {...register("transaction_date", {
              setValueAs: (value) => (value === "" ? undefined : value),
            })}
            aria-label="Tanggal Transaksi"
            className={inputClass}
          />
          {errors.transaction_date && (
            <p className="mt-1 text-xs text-destructive">
              {errors.transaction_date.message}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Deskripsi
          </label>
          <textarea
            rows={3}
            placeholder="opsional"
            {...register("description")}
            aria-label="Deskripsi"
            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all resize-none"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        {createExpenseMutation.isError && (
          <div className="md:col-span-2 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {createExpenseMutation.error instanceof Error
              ? createExpenseMutation.error.message
              : "Gagal menambahkan transaksi"}
          </div>
        )}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="h-4 w-4" />
            )}
            {isLoading ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </div>
      </form>
    </div>
  );
}

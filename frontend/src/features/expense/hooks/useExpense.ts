import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExpense,
  deleteExpense,
  getExpenseById,
  getExpenses,
  getExpenseSummaryAllTime,
  getExpenseSummaryByMonth,
  getExpenseSummaryByYear,
  updateExpense,
} from "../api/expenseApi";
import {
  CreateExpenseInput,
  ExpenseListFilters,
  UpdateExpenseInput,
} from "../types";
import { useAuthStore } from "@/features/auth/store";

// Query key factory:
// Kita simpan semua key React Query di satu tempat agar konsisten.
// Keuntungannya: saat invalidate cache, kita tidak typo key string.
export const expenseQueryKeys = {
  all: ["expenses"] as const,
  lists: () => [...expenseQueryKeys.all, "list"] as const,
  list: (limit: number, offset: number, filters?: ExpenseListFilters) =>
    [...expenseQueryKeys.lists(), { limit, offset, filters }] as const,
  details: () => [...expenseQueryKeys.all, "detail"] as const,
  detail: (expenseId: string) =>
    [...expenseQueryKeys.details(), expenseId] as const,
  summary: () => [...expenseQueryKeys.all, "summary"] as const,
  summaryAllTime: () => [...expenseQueryKeys.summary(), "all-time"] as const,
  summaryByMonth: (month: number, year: number) =>
    [...expenseQueryKeys.summary(), "monthly", { month, year }] as const,
  summaryByYear: (year: number) =>
    [...expenseQueryKeys.summary(), "yearly", { year }] as const,
};

type UseExpensesParams = {
  limit?: number;
  offset?: number;
  enabled?: boolean;
  filters?: ExpenseListFilters;
};

// Hook untuk ambil list expense dengan pagination.
// Dipakai untuk halaman tabel/list utama.
export function useExpenses(params?: UseExpensesParams) {
  const userId = useAuthStore((state) => state.user?.id);
  const limit = params?.limit ?? 100;
  const offset = params?.offset ?? 0;
  const filters = params?.filters;

  return useQuery({
    queryKey: [...expenseQueryKeys.list(limit, offset, filters), userId],
    queryFn: () => getExpenses({ limit, offset, filters }),
    enabled: (params?.enabled ?? true) && Boolean(userId),
  });
}

// Hook untuk detail 1 expense berdasarkan ID.
// enabled otomatis false kalau expenseId kosong agar tidak request sia-sia.
export function useExpense(expenseId?: string, enabled = true) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [...expenseQueryKeys.detail(expenseId || "unknown"), userId],
    queryFn: () => {
      if (!expenseId) throw new Error("Expense ID is required");
      return getExpenseById(expenseId);
    },
    enabled: enabled && Boolean(expenseId && userId),
  });
}

// Hook summary all-time.
export function useExpenseSummaryAllTime(enabled = true) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [...expenseQueryKeys.summaryAllTime(), userId],
    queryFn: getExpenseSummaryAllTime,
    enabled: enabled && Boolean(userId),
  });
}

// Hook summary monthly.
// enabled default: true hanya jika month dan year valid.
export function useExpenseSummaryByMonth(
  month: number,
  year: number,
  enabled?: boolean,
) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [...expenseQueryKeys.summaryByMonth(month, year), userId],
    queryFn: () => getExpenseSummaryByMonth(month, year),
    enabled: (enabled ?? Boolean(month && year)) && Boolean(userId),
  });
}

// Hook summary yearly.
export function useExpenseSummaryByYear(year: number, enabled?: boolean) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: [...expenseQueryKeys.summaryByYear(year), userId],
    queryFn: () => getExpenseSummaryByYear(year),
    enabled: (enabled ?? Boolean(year)) && Boolean(userId),
  });
}

// Mutation create expense.
// Setelah create sukses, list + summary di-refresh agar UI langsung menampilkan data terbaru.
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      operationId,
    }: {
      payload: CreateExpenseInput;
      operationId: string;
    }) => createExpense(payload, operationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: expenseQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: expenseQueryKeys.summary() }),
      ]);
    },
  });
}

// Mutation update expense.
// Kita invalidasi detail ID terkait, list, dan summary supaya semua tampilan konsisten.
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      expenseId,
      payload,
    }: {
      expenseId: string;
      payload: UpdateExpenseInput;
    }) => updateExpense(expenseId, payload),
    onSuccess: async (_updatedExpense, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: expenseQueryKeys.detail(variables.expenseId),
        }),
        queryClient.invalidateQueries({ queryKey: expenseQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: expenseQueryKeys.summary() }),
      ]);
    },
  });
}

// Mutation delete expense.
// Detail cache untuk ID yang dihapus di-remove agar tidak ada data "hantu" di UI.
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(expenseId),
    onSuccess: async (_result, expenseId) => {
      queryClient.removeQueries({
        queryKey: expenseQueryKeys.detail(expenseId),
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: expenseQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: expenseQueryKeys.summary() }),
      ]);
    },
  });
}

import {
  CreateExpenseInput,
  Expense,
  ExpenseListFilters,
  ExpensesListResponse,
  ExpenseSummaryResponse,
  UpdateExpenseInput,
} from "../types";
import {
  fetchWithTimeout,
  parseErrorMessage,
  getAuthHeaders,
} from "@/lib/fetch";

const BASE_URL =
  typeof window === "undefined" ? process.env.NEXT_PUBLIC_API_URL : "";

if (typeof window === "undefined" && !BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not defined");
}

// GET /api/expenses?limit=&offset=
// Dipakai untuk ambil list expense user yang sedang login.
export const getExpenses = async (
  params: {
    limit?: number;
    offset?: number;
    filters?: ExpenseListFilters;
  } = {},
): Promise<ExpensesListResponse> => {
  const limit = params.limit ?? 100;
  const offset = params.offset ?? 0;
  const filters = params.filters;
  const headers = await getAuthHeaders(false);

  const searchParams = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (filters?.type) searchParams.set("type", filters.type);
  if (filters?.category?.trim())
    searchParams.set("category", filters.category.trim());
  if (filters?.q?.trim()) searchParams.set("q", filters.q.trim());
  if (filters?.date_from) searchParams.set("date_from", filters.date_from);
  if (filters?.date_to) searchParams.set("date_to", filters.date_to);
  if (filters?.sort_by) searchParams.set("sort_by", filters.sort_by);
  if (filters?.sort_order) searchParams.set("sort_order", filters.sort_order);

  const res = await fetchWithTimeout(
    `${BASE_URL}/api/expenses?${searchParams.toString()}`,
    {
      method: "GET",
      headers,
      credentials: "include",
    },
  );

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to fetch expenses"));
  }

  return res.json();
};

// GET /api/expenses/{expense_id}
// Dipakai saat user membuka detail satu transaksi tertentu.
export const getExpenseById = async (expenseId: string): Promise<Expense> => {
  const headers = await getAuthHeaders(false);

  const res = await fetchWithTimeout(`${BASE_URL}/api/expenses/${expenseId}`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Failed to fetch expense detail"),
    );
  }

  return res.json();
};

// POST /api/expenses
// Dipakai untuk membuat transaksi expense/income baru.
export const createExpense = async (
  payload: CreateExpenseInput,
  operationId = crypto.randomUUID(),
): Promise<Expense> => {
  const headers = new Headers(await getAuthHeaders());
  headers.set("Idempotency-Key", operationId);

  let res: Response;
  try {
    res = await fetchWithTimeout(`${BASE_URL}/api/expenses`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Request timeout - please try again"
    ) {
      try {
        return await getExpenseById(operationId);
      } catch {
        throw new Error(
          "Request timeout. Coba kembali; ID operasi yang sama akan mencegah pencatatan ganda.",
        );
      }
    }
    throw error;
  }

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to create expense"));
  }

  return res.json();
};

// PATCH /api/expenses/{expense_id}
// Dipakai untuk update sebagian field expense (partial update).
export const updateExpense = async (
  expenseId: string,
  payload: UpdateExpenseInput,
): Promise<Expense> => {
  const headers = await getAuthHeaders();

  const res = await fetchWithTimeout(`${BASE_URL}/api/expenses/${expenseId}`, {
    method: "PATCH",
    headers,
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to update expense"));
  }

  return res.json();
};

// DELETE /api/expenses/{expense_id}
// Backend mengembalikan 204 (No Content), jadi fungsi cukup return void.
export const deleteExpense = async (expenseId: string): Promise<void> => {
  const headers = await getAuthHeaders(false);

  const request = () =>
    fetchWithTimeout(`${BASE_URL}/api/expenses/${expenseId}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

  let res: Response;
  try {
    res = await request();
  } catch (error) {
    // Retry sekali untuk mengatasi network hiccup sementara (mis. HMR/dev reload).
    if (error instanceof TypeError) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      res = await request();
    } else {
      throw error;
    }
  }

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to delete expense"));
  }
};

// GET /api/expenses/summary
// Ringkasan seluruh waktu (all-time).
export const getExpenseSummaryAllTime =
  async (): Promise<ExpenseSummaryResponse> => {
    const headers = await getAuthHeaders(false);

    const res = await fetchWithTimeout(`${BASE_URL}/api/expenses/summary`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(
        await parseErrorMessage(res, "Failed to fetch all-time summary"),
      );
    }

    return res.json();
  };

// GET /api/expenses/summary/monthly?month=&year=
// Ringkasan bulanan berdasarkan bulan & tahun.
export const getExpenseSummaryByMonth = async (
  month: number,
  year: number,
): Promise<ExpenseSummaryResponse> => {
  const headers = await getAuthHeaders(false);

  const res = await fetchWithTimeout(
    `${BASE_URL}/api/expenses/summary/monthly?month=${month}&year=${year}`,
    {
      method: "GET",
      headers,
      credentials: "include",
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Failed to fetch monthly summary"),
    );
  }

  return res.json();
};

// GET /api/expenses/summary/yearly?year=
// Ringkasan tahunan berdasarkan tahun tertentu.
export const getExpenseSummaryByYear = async (
  year: number,
): Promise<ExpenseSummaryResponse> => {
  const headers = await getAuthHeaders(false);

  const res = await fetchWithTimeout(
    `${BASE_URL}/api/expenses/summary/yearly?year=${year}`,
    {
      method: "GET",
      headers,
      credentials: "include",
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Failed to fetch yearly summary"),
    );
  }

  return res.json();
};

// GET /api/expenses/export/csv
// Export expense user yang login sebagai file CSV.
export const exportExpensesCsv = async (): Promise<Blob> => {
  const headers = await getAuthHeaders(false);

  const res = await fetchWithTimeout(`${BASE_URL}/api/expenses/export/csv`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await parseErrorMessage(res, "Failed to export expenses"));
  }

  return res.blob();
};

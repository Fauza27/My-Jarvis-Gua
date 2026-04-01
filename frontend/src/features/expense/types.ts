export interface Expense {
  id: string;
  amount: number;
  type: "income" | "expense";
  description?: string;
  category: string;
  subcategory?: string;
  payment_method?: string;
  transaction_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  amount: number;
  type: "income" | "expense";
  description?: string;
  category: string;
  subcategory?: string;
  payment_method?: string;
  transaction_date?: string;
}

export interface UpdateExpenseInput {
  amount?: number;
  type?: "income" | "expense";
  description?: string;
  category?: string;
  subcategory?: string;
  payment_method?: string;
  transaction_date?: string;
}

export interface ExpensesListResponse {
  expenses: Expense[];
  total: number;
}

export interface ExpenseListFilters {
  type?: "income" | "expense";
  category?: string;
  q?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: "created_at" | "transaction_date" | "amount";
  sort_order?: "asc" | "desc";
}

export interface ExpenseSummaryResponse {
  total_income: number;
  total_expense: number;
  net_balance: number;
}

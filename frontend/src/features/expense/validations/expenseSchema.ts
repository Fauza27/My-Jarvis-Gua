import z from "zod";

export const expenseSchema = z.object({
  id: z.uuid("Invalid ID format").optional(),
  amount: z.number().positive("Amount must be a positive number"),
  type: z.enum(["income", "expense"], "Type must be either 'income' or 'expense'"),
  description: z.string().max(255, "Description must be at most 255 characters").optional(),
  category: z.string().max(100, "Category must be at most 100 characters"),
  subcategory: z.string().max(100, "Subcategory must be at most 100 characters").optional(),
  payment_method: z.string().max(100, "Payment method must be at most 100 characters").optional(),
  transaction_date: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, "Invalid date format")
    .optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const createExpenseSchema = expenseSchema.omit({ id: true, created_at: true, updated_at: true });
export const updateExpenseSchema = createExpenseSchema.partial();

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

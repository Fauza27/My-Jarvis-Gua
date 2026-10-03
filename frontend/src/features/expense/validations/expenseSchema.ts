import z from "zod";

export const expenseSchema = z.object({
  id: z.uuid("Invalid ID format").optional(),
  amount: z
    .number()
    .min(0.01, "Amount must be at least 0.01")
    .max(9999999999999.99),
  type: z.enum(
    ["income", "expense"],
    "Type must be either 'income' or 'expense'",
  ),
  description: z
    .string()
    .max(255, "Description must be at most 255 characters")
    .optional(),
  category: z.string().trim().min(1, "Category is required").max(50),
  subcategory: z.string().trim().max(50).optional(),
  payment_method: z.string().trim().max(50).optional(),
  transaction_date: z
    .string()
    .refine(
      (value) =>
        !value ||
        (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
          !Number.isNaN(Date.parse(value)) &&
          new Date(value).toISOString().slice(0, 10) === value),
      "Invalid date",
    )
    .optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const createExpenseSchema = expenseSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export const updateExpenseSchema = createExpenseSchema.partial().extend({
  description: expenseSchema.shape.description.nullable(),
  subcategory: expenseSchema.shape.subcategory.nullable(),
  payment_method: expenseSchema.shape.payment_method.nullable(),
  transaction_date: expenseSchema.shape.transaction_date.nullable(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

import type { FieldMappingConfig } from "@formintel/react-sdk";

/**
 * Field mapping is the only "SDK-aware" configuration this form needs.
 * Everything else about the form (markup, validation, submit handler)
 * stays exactly as it would without the SDK.
 */
export const expenseFieldMappings: FieldMappingConfig = {
  vendor: { semanticKey: "expense_vendor", label: "Vendor", enableSuggestions: true },
  category: { semanticKey: "expense_category", label: "Category", enableSuggestions: true },
  description: {
    semanticKey: "expense_description",
    label: "Description",
    enableSuggestions: true,
    enableAI: true,
  },
  amount: { semanticKey: "expense_amount", label: "Amount", enableSuggestions: false },
  notes: { semanticKey: "expense_notes", label: "Internal notes", enableSuggestions: false, sensitive: true },
};

export interface ExpenseFormValues {
  vendor: string;
  category: string;
  description: string;
  amount: string;
  notes: string;
}

export const emptyExpense: ExpenseFormValues = {
  vendor: "",
  category: "",
  description: "",
  amount: "",
  notes: "",
};

import React, { useState } from "react";
import {
  SmartField,
  DraftRestoreBanner,
  useFormIntelligence,
  useFormIntelligenceField,
} from "@formintel/react-sdk";
import { emptyExpense, type ExpenseFormValues } from "./expenseFormConfig";

interface ExpenseFormProps {
  onSubmitted: (values: ExpenseFormValues) => void;
}

/**
 * This is a realistic, pre-existing expense form. Its own state management,
 * validation, and submit handler are completely unchanged. The only additions
 * for Form Intelligence are:
 *   1. Swapping plain <input>s for <SmartField> on the fields we want
 *      autosave/suggestions/AI on (vendor, category, description).
 *   2. Dropping in <DraftRestoreBanner> once, near the top.
 *   3. Calling markSubmitted() from useFormIntelligence() on submit.
 * The "amount" and "notes" fields are left as completely plain, un-instrumented
 * <input>s to show the SDK does not require touching every control.
 */
export function ExpenseForm({ onSubmitted }: ExpenseFormProps) {
  const [values, setValues] = useState<ExpenseFormValues>(emptyExpense);
  const { markSubmitted } = useFormIntelligence();
  // Amount/notes stay plain <input>s but still register their value so
  // autosave/draft-restore covers the whole form, not just SmartFields.
  const amountField = useFormIntelligenceField("amount");
  const notesField = useFormIntelligenceField("notes");

  const setField = (name: keyof ExpenseFormValues) => (value: string) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const handleApplyDraftValue = (fieldName: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldName]: value as string }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await markSubmitted();
    onSubmitted(values);
    setValues(emptyExpense);
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit}>
      <DraftRestoreBanner applyValue={handleApplyDraftValue} className="draft-banner" />

      <label>
        Vendor
        <SmartField name="vendor" value={values.vendor} onChange={setField("vendor")} placeholder="e.g. Delta Airlines" />
      </label>

      <label>
        Category
        <SmartField name="category" value={values.category} onChange={setField("category")} placeholder="e.g. Travel" />
      </label>

      <label>
        Description
        <SmartField
          name="description"
          value={values.description}
          onChange={setField("description")}
          multiline
          placeholder="What was this expense for?"
        />
      </label>

      {/* Plain, unmodified controls — the SDK never requires touching these. */}
      <label>
        Amount (USD)
        <input
          type="number"
          name="amount"
          value={values.amount}
          onChange={(e) => {
            setField("amount")(e.target.value);
            amountField.registerChange(e.target.value);
          }}
          onFocus={amountField.registerFocus}
          onBlur={amountField.registerBlur}
          placeholder="0.00"
        />
      </label>

      <label>
        Internal notes <span className="hint">(sensitive — excluded from suggestions/analytics payloads)</span>
        <input
          type="text"
          name="notes"
          value={values.notes}
          onChange={(e) => {
            setField("notes")(e.target.value);
            notesField.registerChange(e.target.value);
          }}
          onFocus={notesField.registerFocus}
          onBlur={notesField.registerBlur}
          placeholder="Optional"
        />
      </label>

      <button type="submit" className="primary">
        Submit expense
      </button>
    </form>
  );
}

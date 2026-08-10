import { useCallback } from "react";
import { useFormIntelligence } from "../context/FormIntelligenceContext";
import type { FormValues } from "../types";

export interface UseDraftRestoreResult {
  hasPendingDraft: boolean;
  /** Restore the draft and apply each field via `applyValue` (e.g. your form library's setValue). */
  restore: (applyValue: (fieldName: string, value: unknown) => void) => Promise<FormValues | null>;
  dismiss: () => void;
}

export function useDraftRestore(): UseDraftRestoreResult {
  const { hasPendingDraft, restoreDraft, dismissDraft } = useFormIntelligence();

  const restore = useCallback(
    async (applyValue: (fieldName: string, value: unknown) => void) => {
      const values = await restoreDraft();
      if (values) {
        Object.entries(values).forEach(([fieldName, value]) => applyValue(fieldName, value));
      }
      return values;
    },
    [restoreDraft]
  );

  return { hasPendingDraft, restore, dismiss: dismissDraft };
}

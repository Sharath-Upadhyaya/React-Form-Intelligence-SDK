import { createContext, useContext } from "react";
import type {
  AIProvider,
  AnalyticsEvent,
  AnalyticsEventName,
  FieldMapping,
  FieldMappingConfig,
  FormValues,
  StorageAdapter,
} from "../types";

export interface FormIntelligenceContextValue {
  formId: string;
  userId?: string;
  storage: StorageAdapter;
  aiProvider: AIProvider;
  autosaveDebounceMs: number;
  disableAutosave: boolean;
  fields: FieldMappingConfig;

  /** Current in-memory snapshot of all registered field values (for AI context / debugging). */
  getAllValues: () => FormValues;
  /** Register/update a field's live value (called by SmartField / useFormIntelligenceField). */
  setFieldValue: (fieldName: string, value: unknown) => void;
  /** Look up (or default) the mapping for a field name. */
  getFieldMapping: (fieldName: string) => FieldMapping;

  /** Draft lifecycle */
  hasPendingDraft: boolean;
  restoreDraft: () => Promise<FormValues | null>;
  dismissDraft: () => void;
  clearDraft: () => Promise<void>;
  markSubmitted: () => Promise<void>;

  /** Analytics */
  track: (name: AnalyticsEventName, fieldName?: string, meta?: Record<string, unknown>) => void;
}

export const FormIntelligenceContext = createContext<FormIntelligenceContextValue | null>(null);

export function useFormIntelligence(): FormIntelligenceContextValue {
  const ctx = useContext(FormIntelligenceContext);
  if (!ctx) {
    throw new Error(
      "useFormIntelligence() was called outside a <FormIntelligenceProvider>. " +
        "Wrap your form (or the page) with <FormIntelligenceProvider config={...}>."
    );
  }
  return ctx;
}

/** Non-throwing variant — returns null when no provider is present. */
export function useFormIntelligenceOptional(): FormIntelligenceContextValue | null {
  return useContext(FormIntelligenceContext);
}

export type { AnalyticsEvent };

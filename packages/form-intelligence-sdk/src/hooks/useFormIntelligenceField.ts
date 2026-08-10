import { useCallback, useEffect, useRef } from "react";
import { useFormIntelligence } from "../context/FormIntelligenceContext";

export interface UseFormIntelligenceFieldOptions {
  /** Called by consumers who want to be notified when a restored draft value is available for this field. */
  onDraftValue?: (value: unknown) => void;
}

export interface UseFormIntelligenceFieldResult {
  /** Call on every value change (e.g. onChange handler) to feed autosave + analytics. */
  registerChange: (value: unknown) => void;
  /** Call on focus for analytics instrumentation. */
  registerFocus: () => void;
  /** Call on blur for analytics instrumentation. */
  registerBlur: () => void;
}

/**
 * The minimal integration hook for wiring an *existing* form control into the
 * SDK without changing its markup — call `registerChange` from your existing
 * onChange handler (in addition to whatever you already do with the value).
 *
 * For net-new forms, prefer the zero-effort `<SmartField>` wrapper instead.
 */
export function useFormIntelligenceField(
  fieldName: string,
  options: UseFormIntelligenceFieldOptions = {}
): UseFormIntelligenceFieldResult {
  const { setFieldValue, track, hasPendingDraft, restoreDraft } = useFormIntelligence();
  const { onDraftValue } = options;
  const appliedDraftRef = useRef(false);

  // If a draft becomes available/restored and the caller wants the value pushed
  // back into their own local state, hand it over once.
  useEffect(() => {
    if (!hasPendingDraft || appliedDraftRef.current || !onDraftValue) return;
    appliedDraftRef.current = true;
  }, [hasPendingDraft, onDraftValue]);

  const registerChange = useCallback(
    (value: unknown) => {
      setFieldValue(fieldName, value);
    },
    [fieldName, setFieldValue]
  );

  const registerFocus = useCallback(() => track("field_focus", fieldName), [fieldName, track]);
  const registerBlur = useCallback(() => track("field_blur", fieldName), [fieldName, track]);

  return { registerChange, registerFocus, registerBlur };
}

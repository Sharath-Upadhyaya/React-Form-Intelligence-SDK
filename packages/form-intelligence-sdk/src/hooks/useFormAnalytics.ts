import { useCallback } from "react";
import { useFormIntelligence } from "../context/FormIntelligenceContext";
import type { AnalyticsEventName } from "../types";

export interface UseFormAnalyticsResult {
  /** Emit a custom or standard analytics event, tagged with this form's id. */
  track: (name: AnalyticsEventName, fieldName?: string, meta?: Record<string, unknown>) => void;
  formId: string;
}

/** Thin convenience hook for emitting analytics events from custom UI (e.g. a "Submit" button). */
export function useFormAnalytics(): UseFormAnalyticsResult {
  const { track, formId } = useFormIntelligence();
  const trackCallback = useCallback(
    (name: AnalyticsEventName, fieldName?: string, meta?: Record<string, unknown>) => track(name, fieldName, meta),
    [track]
  );
  return { track: trackCallback, formId };
}

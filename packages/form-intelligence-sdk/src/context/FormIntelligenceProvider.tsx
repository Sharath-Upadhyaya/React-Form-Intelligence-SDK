import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormIntelligenceContext, type FormIntelligenceContextValue } from "./FormIntelligenceContext";
import { createLocalStorageAdapter } from "../storage/localStorageAdapter";
import { createMockAIProvider } from "../ai/mockAIProvider";
import { createNoopAnalyticsSink } from "../analytics/noopAnalyticsSink";
import type {
  AnalyticsEventName,
  AnalyticsSink,
  FieldMapping,
  FormIntelligenceConfig,
  FormValues,
} from "../types";

export interface FormIntelligenceProviderProps {
  config: FormIntelligenceConfig;
  children: React.ReactNode;
}

const DEFAULT_MAPPING: FieldMapping = { semanticKey: "", enableSuggestions: true, enableAI: false };

/**
 * The single provider you wrap around an existing form/page to light up
 * autosave, draft restoration, cross-user suggestions, optional AI
 * suggestions, and analytics — with no changes required to your existing
 * form controls beyond registering field values (see `useFormIntelligenceField`
 * or the `<SmartField>` wrapper).
 */
export function FormIntelligenceProvider({ config, children }: FormIntelligenceProviderProps) {
  const storage = useMemo(() => config.storage ?? createLocalStorageAdapter(), [config.storage]);
  const aiProvider = useMemo(() => config.aiProvider ?? createMockAIProvider(), [config.aiProvider]);
  const sinks: AnalyticsSink[] = useMemo(() => {
    if (!config.analytics) return [createNoopAnalyticsSink()];
    return Array.isArray(config.analytics) ? config.analytics : [config.analytics];
  }, [config.analytics]);

  const autosaveDebounceMs = config.autosaveDebounceMs ?? 800;
  const disableAutosave = config.disableAutosave ?? false;
  const fields = config.fields ?? {};

  const valuesRef = useRef<FormValues>({});
  const [hasPendingDraft, setHasPendingDraft] = useState(false);
  const draftRef = useRef<FormValues | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const track = useCallback(
    (name: AnalyticsEventName, fieldName?: string, meta?: Record<string, unknown>) => {
      const event = { name, formId: config.formId, fieldName, timestamp: Date.now(), meta };
      sinks.forEach((s) => s.track(event));
    },
    [sinks, config.formId]
  );

  const getFieldMapping = useCallback(
    (fieldName: string): FieldMapping => {
      const mapping = fields[fieldName];
      if (mapping) return mapping;
      return { ...DEFAULT_MAPPING, semanticKey: fieldName };
    },
    [fields]
  );

  const getAllValues = useCallback(() => ({ ...valuesRef.current }), []);

  const scheduleAutosave = useCallback(() => {
    if (disableAutosave) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      storage
        .saveDraft({
          formId: config.formId,
          userId: config.userId,
          values: { ...valuesRef.current },
          updatedAt: Date.now(),
        })
        .then(() => track("draft_saved"))
        .catch(() => {
          /* swallow storage errors — autosave should never crash the host form */
        });
    }, autosaveDebounceMs);
  }, [autosaveDebounceMs, config.formId, config.userId, disableAutosave, storage, track]);

  const setFieldValue = useCallback(
    (fieldName: string, value: unknown) => {
      valuesRef.current[fieldName] = value;
      track("field_change", fieldName);
      scheduleAutosave();
    },
    [scheduleAutosave, track]
  );

  // On mount: check for an existing draft and surface it (host UI decides how to prompt via hasPendingDraft).
  useEffect(() => {
    track("form_mounted");
    if (disableAutosave) return;
    let cancelled = false;
    storage.loadDraft(config.formId, config.userId).then((draft) => {
      if (cancelled || !draft) return;
      draftRef.current = draft.values;
      setHasPendingDraft(true);
    });
    return () => {
      cancelled = true;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.formId, config.userId, disableAutosave]);

  const restoreDraft = useCallback(async () => {
    const draft = draftRef.current;
    if (!draft) return null;
    Object.entries(draft).forEach(([k, v]) => {
      valuesRef.current[k] = v;
    });
    setHasPendingDraft(false);
    track("draft_restored");
    return draft;
  }, [track]);

  const dismissDraft = useCallback(() => {
    setHasPendingDraft(false);
    track("draft_discarded");
  }, [track]);

  const clearDraft = useCallback(async () => {
    await storage.clearDraft(config.formId, config.userId);
    draftRef.current = null;
    setHasPendingDraft(false);
  }, [config.formId, config.userId, storage]);

  const markSubmitted = useCallback(async () => {
    // Record every non-sensitive field's committed value for cross-user suggestions.
    await Promise.all(
      Object.entries(valuesRef.current).map(([fieldName, value]) => {
        const mapping = getFieldMapping(fieldName);
        if (mapping.sensitive) return Promise.resolve();
        return storage.recordFieldValue(config.formId, fieldName, mapping.semanticKey, value, config.userId);
      })
    );
    track("form_submitted");
    await clearDraft();
  }, [clearDraft, config.formId, config.userId, getFieldMapping, storage, track]);

  const value: FormIntelligenceContextValue = useMemo(
    () => ({
      formId: config.formId,
      userId: config.userId,
      storage,
      aiProvider,
      autosaveDebounceMs,
      disableAutosave,
      fields,
      getAllValues,
      setFieldValue,
      getFieldMapping,
      hasPendingDraft,
      restoreDraft,
      dismissDraft,
      clearDraft,
      markSubmitted,
      track,
    }),
    [
      config.formId,
      config.userId,
      storage,
      aiProvider,
      autosaveDebounceMs,
      disableAutosave,
      fields,
      getAllValues,
      setFieldValue,
      getFieldMapping,
      hasPendingDraft,
      restoreDraft,
      dismissDraft,
      clearDraft,
      markSubmitted,
      track,
    ]
  );

  return <FormIntelligenceContext.Provider value={value}>{children}</FormIntelligenceContext.Provider>;
}

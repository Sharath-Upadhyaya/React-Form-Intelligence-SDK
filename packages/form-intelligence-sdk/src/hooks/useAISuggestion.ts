import { useCallback, useState } from "react";
import { useFormIntelligence } from "../context/FormIntelligenceContext";

export interface UseAISuggestionResult {
  suggestions: string[];
  loading: boolean;
  error: string | null;
  /** Trigger an AI suggestion request using the field's current value + sibling form values as context. */
  requestSuggestion: (currentValue?: unknown) => Promise<void>;
  accept: (value: string) => void;
  clear: () => void;
}

/**
 * Optional AI-assisted suggestions. Disabled unless the field mapping sets
 * `enableAI: true`; the underlying provider is pluggable (defaults to a
 * zero-dependency mock so demos run without an API key).
 */
export function useAISuggestion(fieldName: string): UseAISuggestionResult {
  const { aiProvider, getFieldMapping, getAllValues, track, formId } = useFormIntelligence();
  const mapping = getFieldMapping(fieldName);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSuggestion = useCallback(
    async (currentValue?: unknown) => {
      if (!mapping.enableAI) {
        setError("AI suggestions are not enabled for this field. Set enableAI: true in the field mapping.");
        return;
      }
      setLoading(true);
      setError(null);
      track("ai_suggestion_requested", fieldName);
      try {
        const results = await aiProvider.suggest({
          formId,
          fieldName,
          mapping,
          currentValue,
          allValues: getAllValues(),
        });
        setSuggestions(results);
        if (results.length > 0) track("ai_suggestion_shown", fieldName, { count: results.length });
      } catch (e) {
        setError(e instanceof Error ? e.message : "AI suggestion request failed");
      } finally {
        setLoading(false);
      }
    },
    [aiProvider, fieldName, formId, getAllValues, mapping, track]
  );

  const accept = useCallback(
    (value: string) => {
      track("ai_suggestion_accepted", fieldName, { value });
      setSuggestions([]);
    },
    [fieldName, track]
  );

  const clear = useCallback(() => setSuggestions([]), []);

  return { suggestions, loading, error, requestSuggestion, accept, clear };
}

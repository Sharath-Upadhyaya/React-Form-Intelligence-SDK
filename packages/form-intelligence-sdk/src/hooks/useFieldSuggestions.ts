import { useCallback, useEffect, useRef, useState } from "react";
import { useFormIntelligence } from "../context/FormIntelligenceContext";

export interface UseFieldSuggestionsOptions {
  /** Debounce (ms) between query changes and a suggestion lookup. Default: 200. */
  debounceMs?: number;
  /** Minimum query length before suggestions are fetched. Default: 0 (fetch even on empty focus). */
  minQueryLength?: number;
}

export interface UseFieldSuggestionsResult {
  suggestions: string[];
  loading: boolean;
  /** Call with the field's current input text to refresh suggestions. */
  query: (text: string) => void;
  /** Call when the user picks a suggestion — fires analytics + clears the list. */
  accept: (value: string) => void;
}

/**
 * Cross-user autocomplete: surfaces values other users (or this user, in past
 * sessions) have entered for the same semantic field, ranked by frequency/recency.
 */
export function useFieldSuggestions(fieldName: string, options: UseFieldSuggestionsOptions = {}): UseFieldSuggestionsResult {
  const { debounceMs = 200, minQueryLength = 0 } = options;
  const { formId, storage, getFieldMapping, track } = useFormIntelligence();
  const mapping = getFieldMapping(fieldName);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const query = useCallback(
    (text: string) => {
      if (mapping.enableSuggestions === false || mapping.sensitive) {
        setSuggestions([]);
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      if (text.trim().length < minQueryLength) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      const thisRequest = ++requestIdRef.current;
      timerRef.current = setTimeout(async () => {
        try {
          const results = await storage.getFieldSuggestions(formId, fieldName, mapping.semanticKey, text);
          if (requestIdRef.current !== thisRequest) return; // stale response
          setSuggestions(results);
          if (results.length > 0) track("suggestion_shown", fieldName, { count: results.length });
        } finally {
          if (requestIdRef.current === thisRequest) setLoading(false);
        }
      }, debounceMs);
    },
    [debounceMs, fieldName, formId, mapping.enableSuggestions, mapping.semanticKey, mapping.sensitive, minQueryLength, storage, track]
  );

  const accept = useCallback(
    (value: string) => {
      track("suggestion_accepted", fieldName, { value });
      setSuggestions([]);
    },
    [fieldName, track]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { suggestions, loading, query, accept };
}

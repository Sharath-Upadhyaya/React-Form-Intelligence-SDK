import type { DraftRecord, StorageAdapter } from "../types";

const DRAFT_PREFIX = "formintel:draft:";
const VALUES_PREFIX = "formintel:values:"; // cross-user aggregation store (simulated via localStorage)

interface StoredFieldValues {
  [semanticKey: string]: Array<{ value: unknown; count: number; lastUsed: number }>;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function hasLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

/**
 * Default storage adapter. Persists drafts and a simulated "cross-user" value
 * store to localStorage. Good enough for demos and single-browser prototyping;
 * swap in a real backend-backed StorageAdapter for production/multi-user use.
 */
export function createLocalStorageAdapter(): StorageAdapter {
  const draftKey = (formId: string, userId?: string) => `${DRAFT_PREFIX}${formId}:${userId ?? "anon"}`;
  const valuesKey = (formId: string) => `${VALUES_PREFIX}${formId}`;

  return {
    async saveDraft(draft: DraftRecord) {
      if (!hasLocalStorage()) return;
      window.localStorage.setItem(draftKey(draft.formId, draft.userId), JSON.stringify(draft));
    },

    async loadDraft(formId, userId) {
      if (!hasLocalStorage()) return null;
      const raw = window.localStorage.getItem(draftKey(formId, userId));
      return safeParse<DraftRecord | null>(raw, null);
    },

    async clearDraft(formId, userId) {
      if (!hasLocalStorage()) return;
      window.localStorage.removeItem(draftKey(formId, userId));
    },

    async recordFieldValue(formId, _fieldName, semanticKey, value, _userId) {
      if (!hasLocalStorage()) return;
      if (value === undefined || value === null || value === "") return;
      const stringValue = typeof value === "string" ? value : JSON.stringify(value);
      const key = valuesKey(formId);
      const store = safeParse<StoredFieldValues>(window.localStorage.getItem(key), {});
      const entries = store[semanticKey] ?? [];
      const existing = entries.find((e) => e.value === stringValue);
      if (existing) {
        existing.count += 1;
        existing.lastUsed = Date.now();
      } else {
        entries.push({ value: stringValue, count: 1, lastUsed: Date.now() });
      }
      store[semanticKey] = entries.slice(-200); // cap growth
      window.localStorage.setItem(key, JSON.stringify(store));
    },

    async getFieldSuggestions(formId, _fieldName, semanticKey, query) {
      if (!hasLocalStorage()) return [];
      const store = safeParse<StoredFieldValues>(window.localStorage.getItem(valuesKey(formId)), {});
      const entries = store[semanticKey] ?? [];
      const q = query.trim().toLowerCase();
      return entries
        .filter((e) => (q ? String(e.value).toLowerCase().includes(q) : true))
        .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
        .slice(0, 8)
        .map((e) => String(e.value));
    },
  };
}

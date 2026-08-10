/**
 * Core shared types for the Form Intelligence SDK.
 */

/** A single field's mapping into the intelligence system. */
export interface FieldMapping {
  /** Logical/semantic name used for cross-user aggregation & AI context (e.g. "job_title"). */
  semanticKey: string;
  /** Human-readable label, used in AI prompts and analytics. */
  label?: string;
  /** Enable cross-user suggestions for this field. Default: true. */
  enableSuggestions?: boolean;
  /** Enable AI-assisted suggestions for this field. Default: false. */
  enableAI?: boolean;
  /** Mark field as sensitive — excluded from cross-user aggregation & analytics payloads. */
  sensitive?: boolean;
}

/** Map of fieldName -> FieldMapping (fieldName is the key used in your form state / SmartField `name` prop). */
export type FieldMappingConfig = Record<string, FieldMapping>;

/** Arbitrary JSON-serializable form values keyed by field name. */
export type FormValues = Record<string, unknown>;

/** A persisted draft for a given form. */
export interface DraftRecord {
  formId: string;
  values: FormValues;
  updatedAt: number;
  userId?: string;
}

/** Storage adapter contract — implement this to back drafts/suggestions with any backend. */
export interface StorageAdapter {
  /** Save/overwrite the draft for a form. */
  saveDraft(draft: DraftRecord): Promise<void>;
  /** Load the most recent draft for a form (and optionally a specific user). */
  loadDraft(formId: string, userId?: string): Promise<DraftRecord | null>;
  /** Remove a stored draft (e.g. after successful submit). */
  clearDraft(formId: string, userId?: string): Promise<void>;
  /** Record a submitted/committed value for cross-user suggestion aggregation. */
  recordFieldValue(formId: string, fieldName: string, semanticKey: string, value: unknown, userId?: string): Promise<void>;
  /** Fetch aggregated suggestion candidates for a field, most-frequent/most-recent first. */
  getFieldSuggestions(formId: string, fieldName: string, semanticKey: string, query: string): Promise<string[]>;
}

/** Context passed to an AI provider when generating a suggestion. */
export interface AISuggestionContext {
  formId: string;
  fieldName: string;
  mapping: FieldMapping;
  currentValue: unknown;
  allValues: FormValues;
}

/** AI provider contract — implement this to plug in a real LLM, or use the bundled mock. */
export interface AIProvider {
  suggest(context: AISuggestionContext): Promise<string[]>;
}

/** Analytics event names emitted by the SDK. */
export type AnalyticsEventName =
  | "form_mounted"
  | "draft_saved"
  | "draft_restored"
  | "draft_discarded"
  | "field_focus"
  | "field_blur"
  | "field_change"
  | "suggestion_shown"
  | "suggestion_accepted"
  | "ai_suggestion_requested"
  | "ai_suggestion_shown"
  | "ai_suggestion_accepted"
  | "form_submitted";

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  formId: string;
  fieldName?: string;
  timestamp: number;
  meta?: Record<string, unknown>;
}

/** Analytics sink contract — implement this to forward events to your own analytics backend. */
export interface AnalyticsSink {
  track(event: AnalyticsEvent): void;
}

/** Top-level SDK configuration passed to <FormIntelligenceProvider>. */
export interface FormIntelligenceConfig {
  /** Unique identifier for this form (used as the storage/aggregation namespace). */
  formId: string;
  /** Optional current user id, used to scope drafts and attribute suggestions. */
  userId?: string;
  /** Field-by-field configuration. Unlisted fields fall back to suggestions-on, AI-off. */
  fields?: FieldMappingConfig;
  /** Storage adapter. Defaults to the bundled localStorage adapter. */
  storage?: StorageAdapter;
  /** AI provider. Defaults to the bundled mock heuristic provider. Only used when a field has enableAI. */
  aiProvider?: AIProvider;
  /** Analytics sink(s). Defaults to a no-op sink. */
  analytics?: AnalyticsSink | AnalyticsSink[];
  /** Debounce (ms) for autosave writes. Default: 800. */
  autosaveDebounceMs?: number;
  /** Globally disable autosave/draft-restore (e.g. for a read-only view). Default: false. */
  disableAutosave?: boolean;
}

// Provider (the single wrapper you add around an existing page/form)
export { FormIntelligenceProvider } from "./context/FormIntelligenceProvider";
export type { FormIntelligenceProviderProps } from "./context/FormIntelligenceProvider";
export { useFormIntelligence, useFormIntelligenceOptional } from "./context/FormIntelligenceContext";
export type { FormIntelligenceContextValue } from "./context/FormIntelligenceContext";

// Hooks
export { useFormIntelligenceField } from "./hooks/useFormIntelligenceField";
export type { UseFormIntelligenceFieldResult } from "./hooks/useFormIntelligenceField";
export { useDraftRestore } from "./hooks/useDraftRestore";
export type { UseDraftRestoreResult } from "./hooks/useDraftRestore";
export { useFieldSuggestions } from "./hooks/useFieldSuggestions";
export type { UseFieldSuggestionsResult } from "./hooks/useFieldSuggestions";
export { useAISuggestion } from "./hooks/useAISuggestion";
export type { UseAISuggestionResult } from "./hooks/useAISuggestion";
export { useFormAnalytics } from "./hooks/useFormAnalytics";

// Components
export { SmartField } from "./components/SmartField";
export type { SmartFieldProps } from "./components/SmartField";
export { DraftRestoreBanner } from "./components/DraftRestoreBanner";
export type { DraftRestoreBannerProps } from "./components/DraftRestoreBanner";

// Pluggable building blocks (storage / AI / analytics)
export { createLocalStorageAdapter } from "./storage/localStorageAdapter";
export { createMockAIProvider } from "./ai/mockAIProvider";
export {
  createNoopAnalyticsSink,
  createConsoleAnalyticsSink,
  createInMemoryAnalyticsSink,
} from "./analytics/noopAnalyticsSink";
export type { InMemoryAnalyticsSink } from "./analytics/noopAnalyticsSink";

// Types
export type {
  AIProvider,
  AISuggestionContext,
  AnalyticsEvent,
  AnalyticsEventName,
  AnalyticsSink,
  DraftRecord,
  FieldMapping,
  FieldMappingConfig,
  FormIntelligenceConfig,
  FormValues,
  StorageAdapter,
} from "./types";

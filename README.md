# Form Intelligence SDK

A reusable React/TypeScript plugin that drops into an **existing** form/page
and adds:

- **Autosave** of form drafts (debounced, pluggable storage)
- **Draft restoration** on return visits
- **Cross-user suggestions / autocomplete** (aggregated values for the same
  semantic field across users)
- **Configurable field mappings** (per-field opt-in/opt-out, sensitivity flags)
- **AI-assisted suggestions** (optional, pluggable provider — ships with a
  zero-dependency mock so it works with no API key)
- **Analytics / usage tracking** (pluggable sink(s), ships with console +
  in-memory sinks)

The design goal: **one `<FormIntelligenceProvider>` around an existing page**,
with existing controls left unchanged. You opt individual fields into the
richer experience with `<SmartField>` (zero-config) or the lower-level
`useFormIntelligenceField` hook (for controls you don't want to replace).

> **Note on the "md file":** this build was generated from the Claude project's
> description of the SDK (autosave, draft restoration, cross-user suggestions,
> field mappings, optional AI suggestions, analytics — single-provider
> integration). No separate spec file was found attached to the conversation or
> in the project's docs; if you have a specific spec `.md` you'd like this
> matched against, share it and I'll reconcile the implementation against it.

## Repo layout

```
packages/form-intelligence-sdk/   the SDK (buildable npm package, @formintel/react-sdk)
apps/demo/                        Vite + React demo app showcasing every feature
```

## Quick start

```bash
npm install
npm run build:sdk     # builds the SDK to packages/form-intelligence-sdk/dist
npm run dev:demo       # starts the demo at http://localhost:5173
```

## Using the SDK in your own app

```tsx
import { FormIntelligenceProvider, SmartField, DraftRestoreBanner, useFormIntelligence } from "@formintel/react-sdk";

const fieldMappings = {
  vendor: { semanticKey: "expense_vendor", label: "Vendor", enableSuggestions: true },
  description: { semanticKey: "expense_description", label: "Description", enableSuggestions: true, enableAI: true },
  notes: { semanticKey: "expense_notes", sensitive: true }, // excluded from suggestions/analytics
};

function MyExistingForm() {
  const [values, setValues] = useState({ vendor: "", description: "", notes: "" });
  const { markSubmitted } = useFormIntelligence();

  return (
    <form onSubmit={async (e) => { e.preventDefault(); await markSubmitted(); /* ...existing submit logic... */ }}>
      <DraftRestoreBanner applyValue={(name, value) => setValues((v) => ({ ...v, [name]: value }))} />

      <SmartField name="vendor" value={values.vendor} onChange={(v) => setValues((s) => ({ ...s, vendor: v }))} />

      {/* Existing, untouched control — still gets autosave via the hook */}
      <input value={values.notes} onChange={(e) => setValues((s) => ({ ...s, notes: e.target.value }))} />
    </form>
  );
}

export default function Page() {
  return (
    <FormIntelligenceProvider config={{ formId: "expense-report-v1", userId: currentUser.id, fields: fieldMappings }}>
      <MyExistingForm />
    </FormIntelligenceProvider>
  );
}
```

## API surface

### `<FormIntelligenceProvider config={FormIntelligenceConfig}>`
The single wrapper. `config` fields:

| Field | Type | Notes |
|---|---|---|
| `formId` | `string` | Namespace for drafts + cross-user aggregation. |
| `userId?` | `string` | Scopes drafts per user; suggestions are aggregated across all users of a `formId`. |
| `fields?` | `FieldMappingConfig` | Per-field opt-in/out for suggestions/AI, `sensitive` flag. |
| `storage?` | `StorageAdapter` | Defaults to `createLocalStorageAdapter()`. Implement your own to back with a real API. |
| `aiProvider?` | `AIProvider` | Defaults to `createMockAIProvider()`. Implement `.suggest()` to call a real LLM. |
| `analytics?` | `AnalyticsSink \| AnalyticsSink[]` | Defaults to a no-op sink. Ships with `createConsoleAnalyticsSink`, `createInMemoryAnalyticsSink`. |
| `autosaveDebounceMs?` | `number` | Default `800`. |
| `disableAutosave?` | `boolean` | Turn off autosave/draft-restore for a given mount. |

### Components
- **`<SmartField name value onChange multiline? />`** — zero-config input/textarea replacement wired to autosave, cross-user suggestions, and (if `enableAI`) an AI-suggest affordance.
- **`<DraftRestoreBanner applyValue />`** — renders nothing until a draft exists; offers Restore/Discard.

### Hooks
- **`useFormIntelligence()`** — the full context (draft state, `markSubmitted()`, `track()`, etc.). Must be inside the provider.
- **`useFormIntelligenceField(name)`** — minimal integration for an existing control: `registerChange`, `registerFocus`, `registerBlur`.
- **`useDraftRestore()`** — `{ hasPendingDraft, restore(applyValue), dismiss() }`.
- **`useFieldSuggestions(name)`** — `{ suggestions, loading, query(text), accept(value) }`.
- **`useAISuggestion(name)`** — `{ suggestions, loading, error, requestSuggestion(currentValue), accept, clear }`.
- **`useFormAnalytics()`** — `{ track(name, fieldName?, meta?) }` for custom events.

### Extension points
- **`StorageAdapter`** — implement `saveDraft` / `loadDraft` / `clearDraft` / `recordFieldValue` / `getFieldSuggestions` against your own backend (REST, GraphQL, Firestore, etc.) to make suggestions genuinely cross-user/cross-device instead of the bundled localStorage simulation.
- **`AIProvider`** — implement `.suggest(context)` to call OpenAI/Anthropic/your own model; the mock provider requires no key.
- **`AnalyticsSink`** — implement `.track(event)` to forward to Segment/Amplitude/your own pipeline.

## The demo app

`apps/demo` is a Vite + React app with a realistic expense-report form:

- **Vendor / Category / Description** use `<SmartField>` — autosave + cross-user
  suggestions; Description also has AI-assist enabled.
- **Amount / Internal notes** stay as plain, unmodified `<input>`s (wired via
  the lower-level hook only for autosave), showing the SDK never requires
  replacing every control.
- **Internal notes** is flagged `sensitive`, so it's excluded from cross-user
  aggregation and per-field analytics payloads.
- A **user switcher** (Alice/Bob/Carla) remounts the provider with a different
  `userId`, so you can submit as one user and see suggestions surface for the
  next — this is what makes them "cross-user" rather than per-browser autofill.
- A **live analytics panel** subscribes to the in-memory sink and renders
  every SDK event in real time (`form_mounted`, `draft_saved`, `field_change`,
  `suggestion_shown`, `suggestion_accepted`, `form_submitted`, etc.) — this is
  what a real analytics backend would receive.

Run it:
```bash
npm run dev:demo
# open http://localhost:5173
```

Try:
1. Fill the form, wait ~1s (autosave fires), then refresh the page — the
   draft-restore banner appears.
2. Submit as Alice with Category "Travel", switch to Bob, and start typing
   "Tra" in Category — Alice's value appears as a suggestion.
3. Click "✨ AI suggest" under Description for a mock AI-generated completion.
4. Watch the analytics panel update live as you interact with the form.

## Known simplifications (documented, not hidden)

- The bundled `StorageAdapter` uses `localStorage`, so "cross-user" suggestions
  in the demo are simulated within one browser (per-`formId`, independent of
  `userId`) rather than over a real network — swap in a backend-backed adapter
  for genuine multi-device/multi-user behavior.
- The bundled `AIProvider` is a heuristic mock (no network call, ~350ms
  simulated latency) so the SDK and demo run without any API key.
# React-Form-Intelligence-SDK
# React-Form-Intelligence-SDK

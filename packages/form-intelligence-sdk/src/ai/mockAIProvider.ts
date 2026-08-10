import type { AIProvider, AISuggestionContext } from "../types";

/**
 * Zero-dependency mock AI provider so the SDK/demo run with no API key.
 * Produces plausible heuristic completions from field label + sibling values.
 * Swap for a real provider by implementing `AIProvider.suggest`.
 */
export function createMockAIProvider(): AIProvider {
  return {
    async suggest(ctx: AISuggestionContext): Promise<string[]> {
      // Simulate network latency of a real LLM call.
      await new Promise((r) => setTimeout(r, 350));

      const label = (ctx.mapping.label ?? ctx.fieldName).toLowerCase();
      const current = typeof ctx.currentValue === "string" ? ctx.currentValue : "";

      const templates: Record<string, string[]> = {
        summary: [
          "Results-driven professional with a track record of delivering measurable impact.",
          "Collaborative team member skilled at translating requirements into shipped features.",
        ],
        title: ["Senior Software Engineer", "Product Manager", "Engineering Lead"],
        description: [
          `${current || "This item"} — reviewed and approved per standard process.`,
          `${current || "This entry"} covers routine, pre-approved expenditure.`,
        ],
        default: current
          ? [`${current} (recommended completion)`, `${current} — refined for clarity`]
          : [`Suggested ${label} based on similar entries`],
      };

      const key = Object.keys(templates).find((k) => label.includes(k)) ?? "default";
      return templates[key];
    },
  };
}

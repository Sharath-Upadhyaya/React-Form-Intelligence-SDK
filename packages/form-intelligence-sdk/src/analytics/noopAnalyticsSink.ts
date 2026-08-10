import type { AnalyticsEvent, AnalyticsSink } from "../types";

export function createNoopAnalyticsSink(): AnalyticsSink {
  return {
    track() {
      /* no-op */
    },
  };
}

/** Convenience sink that logs events to the console — handy for demos/dev. */
export function createConsoleAnalyticsSink(prefix = "[formintel]"): AnalyticsSink {
  return {
    track(event) {
      // eslint-disable-next-line no-console
      console.debug(prefix, event.name, event);
    },
  };
}

/** In-memory sink that also exposes a subscribable event log — used by the demo's analytics panel. */
export interface InMemoryAnalyticsSink extends AnalyticsSink {
  getEvents: () => AnalyticsEvent[];
  subscribe: (fn: (events: AnalyticsEvent[]) => void) => () => void;
}

export function createInMemoryAnalyticsSink(): InMemoryAnalyticsSink {
  const events: AnalyticsEvent[] = [];
  const listeners = new Set<(events: AnalyticsEvent[]) => void>();

  const sink: InMemoryAnalyticsSink = {
    track(event) {
      events.push(event);
      if (events.length > 500) events.shift();
      listeners.forEach((fn) => fn([...events]));
    },
    getEvents: () => [...events],
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };

  return sink;
}

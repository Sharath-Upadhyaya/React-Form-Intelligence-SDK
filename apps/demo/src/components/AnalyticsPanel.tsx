import React, { useEffect, useState } from "react";
import type { AnalyticsEvent, InMemoryAnalyticsSink } from "@formintel/react-sdk";

interface AnalyticsPanelProps {
  sink: InMemoryAnalyticsSink;
}

const eventColors: Record<string, string> = {
  form_mounted: "#64748b",
  draft_saved: "#0ea5e9",
  draft_restored: "#22c55e",
  draft_discarded: "#f97316",
  field_focus: "#a3a3a3",
  field_blur: "#a3a3a3",
  field_change: "#94a3b8",
  suggestion_shown: "#8b5cf6",
  suggestion_accepted: "#7c3aed",
  ai_suggestion_requested: "#eab308",
  ai_suggestion_shown: "#facc15",
  ai_suggestion_accepted: "#ca8a04",
  form_submitted: "#16a34a",
};

export function AnalyticsPanel({ sink }: AnalyticsPanelProps) {
  const [events, setEvents] = useState<AnalyticsEvent[]>(sink.getEvents());

  useEffect(() => sink.subscribe(setEvents), [sink]);

  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.name] = (acc[e.name] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <aside className="analytics-panel">
      <h3>Live analytics feed</h3>
      <p className="hint">Every SDK-emitted event, in real time — this is what a real analytics sink would receive.</p>

      <div className="analytics-counts">
        {Object.entries(counts).map(([name, count]) => (
          <span key={name} className="chip" style={{ borderColor: eventColors[name] ?? "#ccc" }}>
            {name} <b>{count}</b>
          </span>
        ))}
      </div>

      <ol className="analytics-log">
        {[...events]
          .slice(-40)
          .reverse()
          .map((e, i) => (
            <li key={i} style={{ borderLeftColor: eventColors[e.name] ?? "#ccc" }}>
              <span className="event-name">{e.name}</span>
              {e.fieldName && <span className="event-field">{e.fieldName}</span>}
              <span className="event-time">{new Date(e.timestamp).toLocaleTimeString()}</span>
              {e.meta && <pre className="event-meta">{JSON.stringify(e.meta)}</pre>}
            </li>
          ))}
      </ol>
    </aside>
  );
}

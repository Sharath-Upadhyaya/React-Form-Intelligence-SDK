import React, { useMemo, useState } from "react";
import { FormIntelligenceProvider, createInMemoryAnalyticsSink, createConsoleAnalyticsSink } from "@formintel/react-sdk";
import { ExpenseForm } from "./forms/ExpenseForm";
import { expenseFieldMappings, type ExpenseFormValues } from "./forms/expenseFormConfig";
import { AnalyticsPanel } from "./components/AnalyticsPanel";

const USERS = ["alice", "bob", "carla"] as const;
type UserId = (typeof USERS)[number];

export default function App() {
  const [userId, setUserId] = useState<UserId>("alice");
  const [submissions, setSubmissions] = useState<ExpenseFormValues[]>([]);

  // A single shared in-memory sink so the analytics panel sees events across
  // user switches (a real analytics sink would similarly outlive any one form mount).
  const analyticsSink = useMemo(() => {
    const sink = createInMemoryAnalyticsSink();
    return sink;
  }, []);
  const consoleSink = useMemo(() => createConsoleAnalyticsSink(), []);

  return (
    <div className="app-shell">
      <header>
        <h1>Form Intelligence SDK — Demo</h1>
        <p className="subtitle">
          One <code>&lt;FormIntelligenceProvider&gt;</code> around an ordinary expense form adds autosave, draft
          restoration, cross-user suggestions, optional AI assist, and analytics.
        </p>

        <div className="user-switcher">
          <span>Acting as:</span>
          {USERS.map((u) => (
            <button key={u} className={u === userId ? "active" : ""} onClick={() => setUserId(u)}>
              {u}
            </button>
          ))}
          <span className="hint">
            Switch users, fill the same field (e.g. "Category"), and watch suggestions from other users appear.
          </span>
        </div>
      </header>

      <main className="layout">
        <section className="form-section">
          {/* Re-keying by userId remounts the provider so each user gets their own
              draft + AI context, while suggestions (stored per-form, not per-user)
              stay shared across everyone — that's what makes them "cross-user". */}
          <FormIntelligenceProvider
            key={userId}
            config={{
              formId: "expense-report-v1",
              userId,
              fields: expenseFieldMappings,
              autosaveDebounceMs: 500,
              analytics: [analyticsSink, consoleSink],
            }}
          >
            <ExpenseForm onSubmitted={(values) => setSubmissions((prev) => [values, ...prev])} />
          </FormIntelligenceProvider>

          {submissions.length > 0 && (
            <div className="submissions">
              <h3>Submitted expenses</h3>
              <ul>
                {submissions.map((s, i) => (
                  <li key={i}>
                    <b>{s.vendor}</b> — {s.category} — ${s.amount || "0.00"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <AnalyticsPanel sink={analyticsSink} />
      </main>
    </div>
  );
}

import React, { useState } from "react";
import { useFormIntelligenceField } from "../hooks/useFormIntelligenceField";
import { useFieldSuggestions } from "../hooks/useFieldSuggestions";
import { useAISuggestion } from "../hooks/useAISuggestion";
import { useFormIntelligence } from "../context/FormIntelligenceContext";

export interface SmartFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  /** Field name — must match the key used in your FieldMappingConfig. */
  name: string;
  value: string;
  onChange: (value: string) => void;
  /** Render as <textarea> instead of <input>. */
  multiline?: boolean;
  className?: string;
}

/**
 * Zero-config drop-in replacement for a plain <input>/<textarea> that
 * automatically wires up autosave, cross-user suggestions, and (when enabled
 * for the field) an "AI suggest" affordance — without you touching any other
 * part of your form. Existing controls can stay exactly as they are; use
 * SmartField only where you want the full experience with zero extra code.
 */
export function SmartField({ name, value, onChange, multiline, className, ...rest }: SmartFieldProps) {
  const { registerChange, registerFocus, registerBlur } = useFormIntelligenceField(name);
  const { suggestions, query, accept } = useFieldSuggestions(name);
  const { getFieldMapping } = useFormIntelligence();
  const mapping = getFieldMapping(name);
  const ai = useAISuggestion(name);
  const [showList, setShowList] = useState(false);

  const handleChange = (next: string) => {
    onChange(next);
    registerChange(next);
    query(next);
  };

  const handlePick = (s: string) => {
    onChange(s);
    accept(s);
    setShowList(false);
  };

  const Tag = multiline ? "textarea" : "input";

  return (
    <div className={className ?? "formintel-smartfield"} style={{ position: "relative" }}>
      <Tag
        {...(rest as any)}
        name={name}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleChange(e.target.value)}
        onFocus={() => {
          registerFocus();
          setShowList(true);
        }}
        onBlur={() => {
          registerBlur();
          setTimeout(() => setShowList(false), 150);
        }}
      />

      {showList && suggestions.length > 0 && (
        <ul className="formintel-suggestions" role="listbox">
          {suggestions.map((s) => (
            <li key={s} role="option" aria-selected={false} onMouseDown={() => handlePick(s)}>
              {s}
            </li>
          ))}
        </ul>
      )}

      {mapping.enableAI && (
        <div className="formintel-ai-row">
          <button type="button" onClick={() => ai.requestSuggestion(value)} disabled={ai.loading}>
            {ai.loading ? "Thinking…" : "✨ AI suggest"}
          </button>
          {ai.error && <span className="formintel-ai-error">{ai.error}</span>}
          {ai.suggestions.length > 0 && (
            <ul className="formintel-ai-suggestions">
              {ai.suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(s);
                      ai.accept(s);
                    }}
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

import React from "react";
import { useDraftRestore } from "../hooks/useDraftRestore";

export interface DraftRestoreBannerProps {
  /** Called per-field to write a restored value back into your form state. */
  applyValue: (fieldName: string, value: unknown) => void;
  className?: string;
  message?: string;
}

/**
 * Drop-in banner: renders nothing until a saved draft is detected, then offers
 * "Restore" / "Discard". No layout assumptions — style via `className`.
 */
export function DraftRestoreBanner({
  applyValue,
  className,
  message = "We found a saved draft of this form.",
}: DraftRestoreBannerProps) {
  const { hasPendingDraft, restore, dismiss } = useDraftRestore();

  if (!hasPendingDraft) return null;

  return (
    <div className={className ?? "formintel-draft-banner"} role="status">
      <span>{message}</span>
      <button type="button" onClick={() => restore(applyValue)}>
        Restore draft
      </button>
      <button type="button" onClick={dismiss}>
        Discard
      </button>
    </div>
  );
}

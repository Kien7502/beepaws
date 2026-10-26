"use client";

import { useSyncExternalStore } from "react";
import { gpcEnabled, optOutSaved, saveOptOut } from "@/lib/privacy-choice";

// The choice lives in a cookie (plus the browser's GPC flag), read as an
// external store: "" on the server (a neutral box), "gpc" / "saved" / "none"
// in the browser. Saving notifies the subscribers so the box updates.
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const snapshot = () => (gpcEnabled() ? "gpc" : optOutSaved() ? "saved" : "none");
const serverSnapshot = () => "";

/** The opt-out control on /privacy-choices. */
export function PrivacyChoice() {
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const set = (on: boolean) => {
    saveOptOut(on);
    listeners.forEach((l) => l());
  };

  return (
    <div className="rounded-2xl border border-[var(--color-accent)]/15 bg-white/60 p-6" aria-live="polite">
      {state === "" ? (
        <p className="text-sm">Checking this browser…</p>
      ) : state === "gpc" ? (
        <p>
          <strong>You&apos;re opted out on this browser.</strong> It sends a Global Privacy Control
          signal, which we treat as an opt-out automatically.
        </p>
      ) : state === "saved" ? (
        <>
          <p>
            <strong>You&apos;re opted out on this browser.</strong>
          </p>
          <button
            type="button"
            onClick={() => set(false)}
            className="mt-4 text-sm font-semibold text-[var(--color-primary)] hover:underline"
          >
            Undo
          </button>
        </>
      ) : (
        <>
          <p>Opt out of the sale or sharing of your personal information for targeted advertising.</p>
          <button
            type="button"
            onClick={() => set(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white pressable hover:opacity-90"
          >
            Opt out on this browser
          </button>
        </>
      )}
    </div>
  );
}

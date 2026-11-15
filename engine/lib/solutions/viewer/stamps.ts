"use client";

/**
 * Per-viewer convenience stamps, kept in `localStorage`. Every access is
 * wrapped in try/catch: private browsing can throw on `setItem` (and even on
 * `getItem` in some browsers), and losing stamps is harmless.
 */

export type StampId = "predicted" | "solved" | "challenge";

const ALL: ReadonlySet<StampId> = new Set(["predicted", "solved", "challenge"]);

function key(id: string): string {
  return `sfl-stamps:${id}`;
}

export function readStamps(id: string): Set<StampId> {
  try {
    const raw = window.localStorage.getItem(key(id));
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is StampId => ALL.has(value as StampId)));
  } catch {
    return new Set();
  }
}

export function addStamp(id: string, stamp: StampId): void {
  try {
    const current = readStamps(id);
    if (current.has(stamp)) return;
    current.add(stamp);
    window.localStorage.setItem(key(id), JSON.stringify([...current]));
  } catch {
    // Storage may be unavailable (private mode); stamps are a convenience only.
  }
}

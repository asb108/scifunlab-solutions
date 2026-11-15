"use client";

/**
 * The lab's play state: which tab, whether something is in flight, the step,
 * the guess and tune values, and the stars from the last landing. Kit- and
 * bench-agnostic: it does not know about models or outputs. `landed(firedAt)`
 * ignores a stale token, so a late physics callback from a restarted or
 * abandoned flight cannot corrupt the state.
 */
import { useSyncExternalStore } from "react";

export type Tab = "guess" | "solve" | "whatif";
export type Phase = "ready" | "flying" | "landed";

export interface LabState {
  tab: Tab;
  phase: Phase;
  step: number;
  guess: number;
  tune: number | null;
  firedAt: number;
  firedTune: number | null;
  guessTouched: boolean;
  tuneTouched: boolean;
  focus: string | null;
  stars: number | null;
}

export interface LabStore {
  getState(): LabState;
  subscribe(listener: () => void): () => void;
  setTab(tab: Tab): void;
  setGuess(value: number): void;
  setTune(value: number): void;
  fire(): void;
  landed(firedAt: number): void;
  goStep(index: number): void;
  setFocus(obj: string | null): void;
}

export interface LabStoreInit {
  guess: number;
  tune: number | null;
  /** The guess's book value, for scoring stars. Null when there is no guess. */
  truth: number | null;
  tolerance: number | null;
}

function starsFor(error: number, tolerance: number): number {
  const tol = tolerance > 0 ? tolerance : 1e-9;
  if (error <= tol) return 3;
  if (error <= tol * 3) return 2;
  return 1;
}

export function createLabStore(init: LabStoreInit): LabStore {
  const listeners = new Set<() => void>();
  let state: LabState = {
    tab: "guess",
    phase: "ready",
    step: 0,
    guess: init.guess,
    tune: init.tune,
    firedAt: 0,
    firedTune: null,
    guessTouched: false,
    tuneTouched: false,
    focus: null,
    stars: null,
  };

  const emit = (patch: Partial<LabState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };

  /** Resolve a flight for `firedAt` as landed, scoring it if it was a guess. */
  const finish = (firedAt: number) => {
    if (firedAt !== state.firedAt || state.phase !== "flying") return;
    let stars = state.stars;
    if (state.tab === "guess" && init.truth !== null && init.tolerance !== null) {
      stars = starsFor(Math.abs(state.guess - init.truth), init.tolerance);
    }
    emit({ phase: "landed", stars });
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setTab(tab) {
      if (tab === state.tab) return;
      // A tab switch mid-flight must not leave phase stuck at "flying": finish
      // the current flight for the tab it was fired from before switching.
      if (state.phase === "flying") finish(state.firedAt);
      emit({ tab, phase: "ready", stars: null, focus: null });
    },
    setGuess(value) {
      if (state.phase === "flying") return;
      emit({ guess: value, guessTouched: true });
    },
    setTune(value) {
      if (state.phase === "flying") return;
      emit({ tune: value, tuneTouched: true });
    },
    fire() {
      // Firing while already flying restarts the flight: the new token makes
      // any pending `landed` call for the old one stale.
      emit({
        phase: "flying",
        firedAt: performance.now(),
        firedTune: state.tab === "whatif" ? state.tune : state.firedTune,
        stars: null,
      });
    },
    landed(firedAt) {
      finish(firedAt);
    },
    goStep(index) {
      emit({ step: Math.max(0, index), focus: null });
    },
    setFocus(obj) {
      emit({ focus: obj !== null && state.focus === obj ? null : obj });
    },
  };
}

export function useLab<T>(store: LabStore, selector: (state: LabState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}

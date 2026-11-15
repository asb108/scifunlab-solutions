"use client";

/**
 * The comic lab bench shell: Guess / Solve / What if, stamps, the figure
 * card, and the chalkboard. Kit-agnostic: everything it needs about the kit
 * comes from `LabPayload` (server-rendered HTML and plain numbers) plus, for
 * What-if's live readout, the kit's pure model (`kitDefinitions`), which is
 * cheap to import on the client because it has no Temml or board.ts in it.
 *
 * No kit has a bench yet (`kitBenches` is empty), so the card always shows
 * the current step's poster here; Fire computes the landing from the model
 * after a short pause instead of a real flight. The bench-aware plumbing
 * (WebGL detection, `?nowebgl`, lost-context fallback, the Labels/Front
 * view/Turntable row) is wired up now so kit bench tasks need only register
 * a component in `kits/benches.ts`.
 */
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import type { BenchCanvasHandle } from "@/lib/solutions/bench/Stage";
import { meetsChallenge } from "@/lib/solutions/challenge";
import { kitBenches } from "@/lib/solutions/kits/benches";
import { kitDefinitions } from "@/lib/solutions/kits/models";
import { modelWithTune } from "@/lib/solutions/kits/types";
import { Chalkboard } from "@/lib/solutions/viewer/Chalkboard";
import type { LabPayload, ViewerPredict } from "@/lib/solutions/viewer/payload";
import { addStamp, readStamps, type StampId } from "@/lib/solutions/viewer/stamps";
import { createLabStore, useLab, type Tab } from "@/lib/solutions/viewer/store";

/** Where the guess control starts: mid-range, but never close enough to the answer to score without trying. */
function startGuess(g: { min: number; max: number; truth: number; tolerance: number }): number {
  const span = g.max - g.min;
  for (const k of [0.5, 0.25, 0.75, 0.1, 0.9]) {
    const v = g.min + span * k;
    if (Math.abs(v - g.truth) > 3 * g.tolerance) return v;
  }
  return g.min;
}

/** `?nowebgl` forces the poster path in dev; otherwise probe once for a context. */
function hasWebGL(): boolean {
  try {
    if (process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).has("nowebgl")) {
      return false;
    }
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

const TAB_INFO: { id: Tab; n: string; label: string; color: string }[] = [
  { id: "guess", n: "1", label: "Guess", color: "bg-[#C4B5FD]" },
  { id: "solve", n: "2", label: "Solve", color: "bg-comic-yellow" },
  { id: "whatif", n: "3", label: "What if", color: "bg-[#5EF2C8]" },
];

const STAMP_INFO: { id: StampId; label: string; tone: string }[] = [
  { id: "predicted", label: "Predicted", tone: "bg-comic-coral" },
  { id: "solved", label: "Solved", tone: "bg-comic-green" },
  { id: "challenge", label: "Challenge", tone: "bg-comic-yellow" },
];

/** A fallback "flight" duration when no bench is mounted to report `landed` itself. */
const FALLBACK_FLIGHT_MS = 600;

function f2(n: number): string {
  return n.toFixed(2);
}

function Stars({ n }: { n: number }) {
  return (
    <span className="text-2xl tracking-widest" aria-label={`${n} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 14, delay: 0.1 + i * 0.1 }}
          className={i < n ? "text-comic-yellow drop-shadow-[2px_2px_0_#0B0E28]" : "text-comic-ink/20"}
        >
          ★
        </motion.span>
      ))}
    </span>
  );
}

function ComicButton({
  children,
  onClick,
  tone = "bg-comic-paper",
  disabled,
  big,
  "aria-pressed": ariaPressed,
}: {
  children: ReactNode;
  onClick(): void;
  tone?: string;
  disabled?: boolean;
  big?: boolean;
  "aria-pressed"?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={ariaPressed}
      className={[
        "min-h-[44px] border-[3px] border-comic-ink px-4 font-black uppercase text-comic-ink shadow-neo-sm transition-transform",
        "hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:opacity-50",
        "focus-visible:outline focus-visible:outline-4 focus-visible:outline-comic-violet",
        big ? "text-xl" : "text-sm",
        tone,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/** "Predict first": the student answers before reading on. Not gated: the board stays visible either way. */
function PredictCard({ predict }: { predict: ViewerPredict }) {
  const [choice, setChoice] = useState<number | null>(null);
  const answered = choice !== null;
  return (
    <div className="mt-3 border-2 border-dashed border-comic-ink bg-comic-yellow/30 p-3">
      <p className="text-xs font-black uppercase tracking-wide">Predict first</p>
      <p className="math-inline mt-1 font-bold" dangerouslySetInnerHTML={{ __html: predict.questionHtml }} />
      <div className="mt-2 grid gap-2" role="group" aria-label="Your prediction">
        {predict.optionsHtml.map((html, index) => {
          const right = index === predict.answer;
          const picked = index === choice;
          return (
            <button
              key={index}
              type="button"
              disabled={answered}
              onClick={() => setChoice(index)}
              className={[
                "math-inline min-h-[44px] border-2 border-comic-ink px-3 py-2 text-left font-bold shadow-neo-sm transition-transform",
                !answered ? "bg-comic-paper hover:-translate-y-0.5" : "",
                answered && right ? "bg-comic-green" : "",
                answered && picked && !right ? "bg-comic-coral" : "",
                answered && !picked && !right ? "bg-comic-paper opacity-60" : "",
              ].join(" ")}
              aria-pressed={picked}
            >
              <span dangerouslySetInnerHTML={{ __html: html }} />
              {answered && right ? (
                <span className="ml-2" aria-label="right answer">
                  ✓
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {answered ? (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="math-inline mt-2 font-bold" aria-live="polite">
            {choice === predict.answer ? "Spot on! " : "Not quite. "}
            <span dangerouslySetInnerHTML={{ __html: predict.revealHtml }} />
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function SolutionLab({ payload, posters }: { payload: LabPayload; posters: ReactNode[] }) {
  const kit = kitDefinitions[payload.kit]!;
  const Bench = kitBenches[payload.kit];

  const [store] = useState(() => {
    const s = createLabStore({
      guess: payload.guess ? startGuess(payload.guess) : 0,
      tune: payload.whatIf?.book ?? null,
      truth: payload.guess?.truth ?? null,
      tolerance: payload.guess?.tolerance ?? null,
    });
    if (!payload.guess) s.setTab("solve");
    return s;
  });

  const tab = useLab(store, (s) => s.tab);
  const phase = useLab(store, (s) => s.phase);
  const step = useLab(store, (s) => s.step);
  const guess = useLab(store, (s) => s.guess);
  const tune = useLab(store, (s) => s.tune);
  const firedAt = useLab(store, (s) => s.firedAt);
  const firedTune = useLab(store, (s) => s.firedTune);
  const stars = useLab(store, (s) => s.stars);

  const tabs = useMemo(
    () => TAB_INFO.filter((t) => (t.id === "guess" ? payload.guess !== null : t.id === "whatif" ? payload.whatIf !== null : true)),
    [payload.guess, payload.whatIf],
  );

  // WebGL availability and lost-context detection. A mounted bench reports its
  // own context loss through `onLost` (routed to `BenchCanvas`); on loss we
  // fall back to the poster and, if a flight was under way, finish it as
  // landed from the model (the bench will never call `landed` itself now).
  const [webglOk, setWebglOk] = useState(true);
  const [lost, setLost] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  useEffect(() => setWebglOk(hasWebGL()), []);
  const onBenchLost = useCallback(() => {
    setLost(true);
    const current = store.getState();
    if (current.phase === "flying") store.landed(current.firedAt);
  }, [store]);
  const mode: "bench" | "poster" = Bench && webglOk && !lost ? "bench" : "poster";

  // In poster mode (no bench for this kit, no WebGL, or the context was lost) nothing in the scene
  // reports `landed`, so stand in with a short pause. Keyed on the rendering mode, not on whether a
  // bench is registered: every kit has one, but it is not mounted without WebGL.
  useEffect(() => {
    if (mode !== "poster" || phase !== "flying") return;
    const token = firedAt;
    const timer = window.setTimeout(() => store.landed(token), FALLBACK_FLIGHT_MS);
    return () => window.clearTimeout(timer);
  }, [mode, phase, firedAt, store]);

  // The bench's imperative view handle, reported through `onHandle`, drives
  // the Front view/Turntable buttons and the card's arrow-key nudges.
  const [benchHandle, setBenchHandle] = useState<BenchCanvasHandle | null>(null);

  // Phones get numbered label badges in the scene; list their names here
  // (measured on the same figure element the bench's canvas fills).
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const measure = () => setCompact(el.clientWidth < 600);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Stamps, read once on mount (storage may be unavailable; readStamps handles that).
  const [stamps, setStamps] = useState<Set<StampId>>(() => new Set());
  useEffect(() => setStamps(readStamps(payload.id)), [payload.id]);
  const earn = useCallback(
    (id: StampId) => {
      addStamp(payload.id, id);
      setStamps((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    },
    [payload.id],
  );
  useEffect(() => {
    if (phase === "landed" && tab === "guess") earn("predicted");
  }, [phase, tab, earn]);
  useEffect(() => {
    if (tab === "solve" && step === payload.steps.length - 1) earn("solved");
  }, [tab, step, earn, payload.steps.length]);

  // What-if: live readout and best-so-far, computed on the client from the
  // pure kit model (never Temml or board.ts, which stay server-only).
  const [bestSoFar, setBestSoFar] = useState<number | null>(null);
  const [challengeMet, setChallengeMet] = useState(false);
  const whatIfModel = useMemo(() => {
    if (!payload.whatIf || tune === null) return null;
    return modelWithTune(kit, payload.numbers, payload.kitParams, payload.whatIf.tune, tune);
  }, [kit, payload.whatIf, payload.numbers, payload.kitParams, tune]);
  const liveOutput = payload.whatIf?.challenge && whatIfModel ? kit.outputs[payload.whatIf.challenge.of](whatIfModel) : null;

  useEffect(() => {
    const challenge = payload.whatIf?.challenge;
    if (!challenge || phase !== "landed" || tab !== "whatif" || firedTune === null) return;
    const m = modelWithTune(kit, payload.numbers, payload.kitParams, payload.whatIf!.tune, firedTune);
    const value = kit.outputs[challenge.of](m);
    setBestSoFar((prev) => {
      if (prev === null) return value;
      if (challenge.kind === "max") return Math.max(prev, value);
      if (challenge.kind === "min") return Math.min(prev, value);
      const target = challenge.target ?? 0;
      return Math.abs(value - target) < Math.abs(prev - target) ? value : prev;
    });
    if (meetsChallenge(value, challenge.best, challenge)) {
      setChallengeMet(true);
      earn("challenge");
    }
    // payload.whatIf is stable for the life of this page; only the fired tune matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, tab, firedTune, kit, payload.numbers, payload.kitParams, earn]);

  const [showLabels, setShowLabels] = useState(false);
  const [turntableOn, setTurntableOn] = useState(false);

  const model = useMemo(() => kit.model(payload.numbers, payload.kitParams), [kit, payload.numbers, payload.kitParams]);
  const currentStep = payload.steps[Math.min(step, payload.steps.length - 1)];
  const poster = (tab === "solve" ? posters[step] : posters[0]) ?? posters[0];

  const title = tab === "solve" ? currentStep.titleHtml : tab === "whatif" ? "What if" : (payload.guess?.label ?? "Guess");
  const hint =
    tab === "guess"
      ? phase === "landed"
        ? "See how close you were"
        : "Drag to guess, then fire"
      : tab === "whatif"
        ? "Turn the dial, then fire"
        : `Step ${step + 1} of ${payload.steps.length}`;
  const readout =
    tab === "guess" && payload.guess
      ? `${f2(guess)}${payload.guess.unit}`
      : tab === "whatif" && payload.whatIf
        ? `${f2(tune ?? payload.whatIf.book)}${payload.whatIf.unit}`
        : `${step + 1}/${payload.steps.length}`;

  const onPanelKeyDown = (event: React.KeyboardEvent) => {
    if (tab !== "solve") return;
    const target = event.target as HTMLElement;
    if (target.closest("input, select, textarea")) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      store.goStep(Math.max(0, step - 1));
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      store.goStep(Math.min(payload.steps.length - 1, step + 1));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:items-start">
      {/* ------------------------------------------------ the figure card */}
      <figure
        ref={cardRef}
        tabIndex={0}
        className="relative min-w-0 overflow-hidden border-[3px] border-comic-ink bg-[#1F3175] shadow-neo-lg outline-none focus-visible:ring-4 focus-visible:ring-comic-violet"
        onKeyDown={(event) => {
          if (!benchHandle) return;
          if (event.key === "ArrowLeft") benchHandle.nudge(-8, 0);
          else if (event.key === "ArrowRight") benchHandle.nudge(8, 0);
          else if (event.key === "ArrowUp") benchHandle.nudge(0, -5);
          else if (event.key === "ArrowDown") benchHandle.nudge(0, 5);
          else return;
          event.preventDefault();
        }}
      >
        <div className="blueprint-grid relative aspect-[16/12] sm:aspect-[16/10]">
          {mode === "bench" && Bench ? (
            <Suspense fallback={poster}>
              <Bench
                model={model}
                numbers={payload.numbers}
                cue={tab === "solve" ? (currentStep?.cue ?? null) : null}
                store={store}
                labels={payload.labels}
                guess={payload.guess?.use ?? null}
                tune={payload.whatIf?.tune ?? null}
                showLabels={showLabels}
                view={payload.view}
                page={payload.page}
                focuses={payload.focuses}
                parts={payload.parts}
                onHandle={setBenchHandle}
                onLost={onBenchLost}
              />
            </Suspense>
          ) : (
            poster
          )}
          <span className="pointer-events-none absolute left-3 top-2 font-mono text-xs font-black uppercase tracking-wider text-comic-paper/80">
            Fig
          </span>
          <span
            className="pointer-events-none absolute right-3 top-2 font-mono text-xs font-black uppercase tracking-wider text-comic-paper/80"
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <span className="pointer-events-none absolute bottom-2 left-3 max-w-[55%] font-mono text-[11px] font-bold text-comic-paper/70">{hint}</span>
          <span className="pointer-events-none absolute bottom-2 right-3 border-2 border-comic-ink bg-comic-paper px-2 py-0.5 font-mono text-[11px] font-black text-comic-ink shadow-neo-sm">
            {readout}
          </span>
        </div>
        {mode === "bench" ? (
          <div className="flex flex-wrap gap-2 border-t-[3px] border-comic-ink bg-[#1a2a66] p-2">
            <button
              type="button"
              aria-pressed={showLabels}
              onClick={() => setShowLabels((v) => !v)}
              className="min-h-[36px] border-2 border-comic-ink bg-comic-paper px-3 font-mono text-xs font-black uppercase text-comic-ink shadow-neo-sm"
            >
              Labels
            </button>
            <button
              type="button"
              onClick={() => benchHandle?.frontView()}
              className="min-h-[36px] border-2 border-comic-ink bg-comic-paper px-3 font-mono text-xs font-black uppercase text-comic-ink shadow-neo-sm"
            >
              Front view
            </button>
            <button
              type="button"
              aria-pressed={turntableOn}
              onClick={() => {
                const next = !turntableOn;
                setTurntableOn(next);
                benchHandle?.turntable(next);
              }}
              className="min-h-[36px] border-2 border-comic-ink bg-comic-paper px-3 font-mono text-xs font-black uppercase text-comic-ink shadow-neo-sm"
            >
              Turntable
            </button>
          </div>
        ) : null}
        {mode === "bench" && showLabels && compact ? (
          <ol className="list-decimal border-t border-comic-ink/40 bg-[#1a2a66] px-6 py-2 font-mono text-[11px] font-bold text-comic-paper/90">
            {payload.parts.map((part) => (
              <li key={part.id}>{part.text}</li>
            ))}
          </ol>
        ) : null}
      </figure>

      {/* ---------------------------------------------------- the panel */}
      <section className="min-w-0 border-[3px] border-comic-ink bg-comic-paper p-4 text-comic-ink shadow-neo" onKeyDown={onPanelKeyDown}>
        <div
          role="tablist"
          aria-label="Ways to work this question"
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map(({ id, n, label, color }) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={tab === id}
              onClick={() => store.setTab(id)}
              className={[
                "flex min-h-[48px] items-center justify-center gap-1.5 border-[3px] border-comic-ink px-1 text-sm font-black uppercase transition-transform",
                tab === id ? `-rotate-1 ${color} shadow-neo-sm` : "bg-comic-paper hover:-translate-y-0.5",
              ].join(" ")}
            >
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-comic-ink text-xs ${tab === id ? "bg-comic-paper" : color}`}>
                {n}
              </span>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 min-h-[300px]">
          <AnimatePresence initial={false}>
            {tab === "guess" && payload.guess ? (
              <motion.div key="guess" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-black">{payload.guess.label}?</h2>
                <label className="mt-4 block font-mono text-sm font-black">
                  Your guess: {f2(guess)} {payload.guess.unit}
                  <input
                    type="range"
                    min={payload.guess.min}
                    max={payload.guess.max}
                    step={payload.guess.step}
                    value={guess}
                    disabled={phase === "flying"}
                    onChange={(event) => store.setGuess(Number(event.target.value))}
                    className="mt-2 block w-full accent-[#7A6CFF]"
                  />
                </label>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <ComicButton big tone="bg-comic-coral" onClick={() => store.fire()} disabled={phase === "flying"}>
                    {phase === "flying" ? "Whoosh…" : "Fire!"}
                  </ComicButton>
                  {phase === "landed" && tabs.some((t) => t.id === "solve") ? (
                    <ComicButton tone="bg-comic-yellow" onClick={() => store.setTab("solve")}>
                      See why →
                    </ComicButton>
                  ) : null}
                </div>
                <AnimatePresence>
                  {phase === "landed" ? (
                    <motion.div key="guess-result" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="relative mt-3" aria-live="polite">
                      <p className="font-bold">
                        It&apos;s {f2(payload.guess.truth)} {payload.guess.unit}. You were off by {f2(Math.abs(guess - payload.guess.truth))}{" "}
                        {payload.guess.unit}.
                      </p>
                      <div className="mt-2">
                        <Stars n={stars ?? 1} />
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            ) : null}

            {tab === "solve" ? (
              <motion.div key={`solve-${step}`} initial={{ opacity: 0, x: 24, rotate: 1 }} animate={{ opacity: 1, x: 0, rotate: 0 }} exit={{ opacity: 0, x: -24 }}>
                <ol className="mb-3 flex flex-wrap gap-1.5" aria-label="Steps">
                  {payload.steps.map((s, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => store.goStep(i)}
                        aria-current={i === step ? "step" : undefined}
                        aria-label={`Step ${i + 1}`}
                        className={[
                          "grid h-9 w-9 place-items-center border-2 border-comic-ink font-mono text-sm font-black",
                          i === step ? "bg-comic-yellow shadow-neo-sm" : i < step ? "bg-comic-green" : "bg-comic-paper",
                        ].join(" ")}
                      >
                        {i < step ? "✓" : i + 1}
                      </button>
                    </li>
                  ))}
                </ol>
                <h2 className="math-inline text-2xl font-black" dangerouslySetInnerHTML={{ __html: currentStep.titleHtml }} />
                {currentStep.predict ? <PredictCard predict={currentStep.predict} /> : null}
                <Chalkboard lines={currentStep.lines} stepKey={`step-${step}`} onLink={(obj) => store.setFocus(obj)} />
                <p className="sr-only" aria-live="polite">
                  {currentStep.describe}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <ComicButton onClick={() => store.goStep(Math.max(0, step - 1))} disabled={step === 0}>
                    ← Back
                  </ComicButton>
                  {step < payload.steps.length - 1 ? (
                    <ComicButton tone="bg-comic-yellow" onClick={() => store.goStep(step + 1)}>
                      Next step →
                    </ComicButton>
                  ) : payload.whatIf ? (
                    <ComicButton tone="bg-comic-yellow" onClick={() => store.setTab("whatif")}>
                      Now break it →
                    </ComicButton>
                  ) : null}
                </div>
                {payload.locked ? (
                  <p className="mt-4 border-2 border-dashed border-comic-ink bg-comic-paper p-3 text-sm font-bold">
                    The rest of this working is part of SciFunLab Plus.
                  </p>
                ) : null}
              </motion.div>
            ) : null}

            {tab === "whatif" && payload.whatIf ? (
              <motion.div key="whatif" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-black">{payload.whatIf.challenge ? "Beat the book" : "Break it"}</h2>
                <p className="mt-1 font-bold">
                  The book uses {payload.whatIf.label.toLowerCase()} = {f2(payload.whatIf.book)}
                  {payload.whatIf.unit}
                  {payload.whatIf.challenge ? `. Chase ${payload.whatIf.challenge.label.toLowerCase()}.` : ". Turn the control and see what changes."}
                </p>
                <label className="mt-4 block font-mono text-sm font-black">
                  {payload.whatIf.label} = {f2(tune ?? payload.whatIf.book)}
                  {payload.whatIf.unit}
                  <input
                    type="range"
                    min={payload.whatIf.min}
                    max={payload.whatIf.max}
                    step={payload.whatIf.step}
                    value={tune ?? payload.whatIf.book}
                    disabled={phase === "flying"}
                    onChange={(event) => store.setTune(Number(event.target.value))}
                    className="mt-2 block w-full accent-[#E8C66A]"
                  />
                </label>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <ComicButton big tone="bg-comic-coral" onClick={() => store.fire()} disabled={phase === "flying"}>
                    {phase === "flying" ? "Whoosh…" : "Fire!"}
                  </ComicButton>
                  <ComicButton onClick={() => store.setTune(payload.whatIf!.book)} disabled={phase === "flying"}>
                    Book value
                  </ComicButton>
                </div>
                {payload.whatIf.challenge ? (
                  <p className="mt-4 font-mono text-sm font-black" aria-live="polite">
                    Live {payload.whatIf.challenge.of}: {liveOutput !== null ? f2(liveOutput) : "—"}
                    {bestSoFar !== null ? <span className="block text-comic-ink/70">Best so far: {f2(bestSoFar)}</span> : null}
                  </p>
                ) : null}
                {challengeMet && payload.whatIf.challenge ? (
                  <motion.p
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-3 border-2 border-dashed border-comic-ink bg-comic-yellow/40 p-3 font-bold"
                  >
                    {payload.whatIf.challenge.label}: {payload.whatIf.challenge.why}
                  </motion.p>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* ------------------------------------------------- stamps row */}
        <div className="mt-4 border-t-[3px] border-dashed border-comic-ink pt-3">
          <p className="font-mono text-xs font-black uppercase tracking-wider">Stamps</p>
          <ul className="mt-2 flex flex-wrap gap-3">
            {STAMP_INFO.filter((s) => s.id !== "challenge" || payload.whatIf?.challenge).map((s, i) => {
              const got = stamps.has(s.id);
              return (
                <li key={s.id}>
                  <motion.span
                    animate={got ? { scale: [1.6, 1], rotate: [-25, i % 2 ? 4 : -4], opacity: 1 } : { scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 12 }}
                    className={["inline-block border-[3px] border-comic-ink px-2.5 py-1 text-xs font-black uppercase", got ? `${s.tone} shadow-neo-sm` : "border-dashed border-comic-ink/45 bg-transparent text-comic-ink"].join(
                      " ",
                    )}
                  >
                    {got ? "✓ " : ""}
                    {s.id === "challenge" && payload.whatIf?.challenge ? payload.whatIf.challenge.label : s.label}
                  </motion.span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}

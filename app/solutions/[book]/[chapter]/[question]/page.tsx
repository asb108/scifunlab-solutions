import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TiltLabel } from "@/components/comic/TiltLabel";
import { renderBoardLine } from "@/lib/solutions/board";
import { challengeBest } from "@/lib/solutions/challenge";
import { givenNumbers } from "@/lib/solutions/defineSolution";
import { givenTex } from "@/lib/solutions/format";
import { kitDefinitions } from "@/lib/solutions/kits/models";
import { kitPosters } from "@/lib/solutions/kits/posters";
import type { KitDefinition, KitModel, KitTunable } from "@/lib/solutions/kits/types";
import { modelWithTune } from "@/lib/solutions/kits/types";
import { renderMath, renderRich } from "@/lib/solutions/math";
import {
  allSolutions,
  bookById,
  bookChapterBySlug,
  solutionByRoute,
  solutionsForChapter,
} from "@/lib/solutions/registry";
import { bookHref, chapterHref, citationLabel, questionHref } from "@/lib/solutions/routes";
import type { Challenge, ContributorCredit, Solution, SolutionInput } from "@/lib/solutions/types";
import type { LabGuess, LabPayload, LabStep, LabWhatIf } from "@/lib/solutions/viewer/payload";
import { restTime } from "@/lib/solutions/viewer/payload";
import { SolutionLab } from "@/lib/solutions/viewer/SolutionLab";

type Params = { book: string; chapter: string; question: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return allSolutions()
    .filter((s) => s.access !== "coming-soon")
    .map((s) => ({ book: s.citation.book, chapter: s.chapterSlug, question: s.slug }));
}

function load(params: Params): Solution {
  const solution = solutionByRoute(params.book, params.chapter, params.question);
  if (!solution || solution.access === "coming-soon") notFound();
  return solution;
}

function citationText(s: Solution): string {
  if (s.sample) return `Sample · Vol ${s.citation.volume} · Ch ${s.citation.chapter}`;
  const prefix = s.citation.book === "hc-verma" ? "HCV" : s.citation.book.toUpperCase();
  return `${prefix} · Vol ${s.citation.volume} · Ch ${s.citation.chapter} · ${citationLabel(s.citation)}`;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const s = load(await params);
  const book = bookById(s.citation.book);
  const prefix = book?.questionTitlePrefix ?? s.citation.book;
  const title = s.sample
    ? `Sample: ${s.title} (${prefix} Ch ${s.citation.chapter} style), 3D animated`
    : `${prefix} Ch ${s.citation.chapter} ${citationLabel(s.citation)} solution, 3D animated`;
  return {
    title,
    description: s.inShort,
    alternates: { canonical: `https://www.scifunlab.com${questionHref(s)}` },
    // Samples are our own practice problems, not book questions.
    robots: s.sample ? { index: false, follow: true } : undefined,
  };
}

const POSTER_W = 640;
const POSTER_H = 400;
const GITHUB_HANDLE_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

function mergeCredits(solutionCredits?: ContributorCredit[], kitCredits?: ContributorCredit[]): ContributorCredit[] {
  const combined = [...(solutionCredits ?? []), ...(kitCredits ?? [])];
  const seen = new Set<string>();
  return combined.filter((credit) => {
    const key = `${credit.name.toLowerCase()}:${(credit.github ?? "").toLowerCase()}`;
    if (!credit.name.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** A rounded range-input step for a span, e.g. 8.4 -> 0.05, 360 -> 2. */
function niceStep(span: number): number {
  if (!(span > 0)) return 1;
  const raw = span / 200;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / magnitude;
  const nice = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  return nice * magnitude;
}

function buildGuess(kit: KitDefinition, model: KitModel, input: SolutionInput["guess"]): LabGuess | null {
  if (input === "none") return null;
  const def = kit.guesses[input.use];
  const [min, max] = def.range(model);
  return {
    use: input.use,
    label: def.label,
    unit: def.unit,
    min,
    max,
    step: niceStep(max - min),
    truth: def.truth(model),
    tolerance: input.tolerance,
  };
}

/** The tune value that best meets a challenge, scanning the tunable's range at its step. */
function bestForChallenge(
  kit: KitDefinition,
  numbers: Record<string, number>,
  kitParams: Record<string, number> | undefined,
  tuneName: string,
  tunable: KitTunable,
  challenge: Challenge,
): { tune: number; value: number } {
  const evaluate = (tune: number) => kit.outputs[challenge.of](modelWithTune(kit, numbers, kitParams, tuneName, tune));
  const range = { min: tunable.min, max: tunable.max, step: tunable.step };
  if (challenge.kind === "target") {
    const target = challenge.target ?? 0;
    const found = challengeBest((tune) => -Math.abs(evaluate(tune) - target), range, "max");
    return { tune: found.tune, value: evaluate(found.tune) };
  }
  return challengeBest(evaluate, range, challenge.kind);
}

function buildWhatIf(
  kit: KitDefinition,
  numbers: Record<string, number>,
  kitParams: Record<string, number> | undefined,
  input: SolutionInput["whatIf"],
): LabWhatIf | null {
  if (!input) return null;
  const tunable = kit.tunables[input.tune];
  const book = tunable.source === "given" ? numbers[tunable.param] : (kitParams ?? {})[tunable.param];
  const challenge = input.challenge
    ? { ...input.challenge, ...renameBest(bestForChallenge(kit, numbers, kitParams, input.tune, tunable, input.challenge)) }
    : undefined;
  return {
    tune: input.tune,
    label: tunable.label,
    unit: tunable.unit,
    min: tunable.min,
    max: tunable.max,
    step: tunable.step,
    book,
    challenge,
  };
}

function renameBest(best: { tune: number; value: number }): { bestTune: number; best: number } {
  return { bestTune: best.tune, best: best.value };
}

export default async function QuestionPage({ params }: { params: Promise<Params> }) {
  const s = load(await params);
  const book = bookById(s.citation.book)!;
  const chapter = bookChapterBySlug(book, s.chapterSlug)!;
  if (s.kit === "custom") notFound(); // Custom scenes arrive with their first use.
  const kit = kitDefinitions[s.kit]!;
  const Poster = kitPosters[s.kit]!;
  const numbers = givenNumbers(s.given);
  const model = kit.model(numbers, s.kitParams);
  const locked = s.access === "subscriber";
  const visible = locked ? s.steps.slice(0, 1) : s.steps;
  const credits = mergeCredits(s.credits, kit.credits);

  // Values the board may reference: kit outputs at book values, plus the given numbers.
  const outputValues = Object.fromEntries(Object.entries(kit.outputs).map(([name, fn]) => [name, fn(model)]));
  const boardValues: Record<string, number> = { ...numbers, ...outputValues };

  const steps: LabStep[] = visible.map((step) => ({
    titleHtml: renderRich(step.title),
    lines: step.board.map((line) => renderBoardLine(line, boardValues)),
    describe: step.describe,
    cue: step.cue,
    predict: step.predict
      ? {
          questionHtml: renderRich(step.predict.question),
          optionsHtml: step.predict.options.map((option) => renderRich(option)),
          answer: step.predict.answer,
          revealHtml: renderRich(step.predict.reveal),
        }
      : undefined,
  }));

  const payload: LabPayload = {
    id: `${s.chapterSlug}/${s.slug}`,
    kit: s.kit,
    numbers,
    kitParams: s.kitParams,
    steps,
    // The free final number is not secret: Guess works even on a locked solution.
    guess: buildGuess(kit, model, s.guess),
    whatIf: locked ? null : buildWhatIf(kit, numbers, s.kitParams, s.whatIf),
    labels: Object.fromEntries(Object.entries(kit.labels(numbers, s.kitParams)).map(([name, tex]) => [name, renderMath(tex)])),
    locked,
    page: kit.page,
    view: kit.view(model),
    focuses: Object.fromEntries(Object.entries(kit.focuses).map(([name, fn]) => [name, fn(model)])),
    parts: Object.entries(kit.parts).map(([id, part]) => ({ id, text: part.text, at: part.at(model) })),
  };

  const posters = visible.map((step, i) => (
    <Poster key={i} model={model} cue={step.cue} t={restTime(model, step.cue)} width={POSTER_W} height={POSTER_H} describe={step.describe} />
  ));

  const siblings = solutionsForChapter(s.citation.chapter, s.citation.book).filter((x) => x.access !== "coming-soon");
  const index = siblings.findIndex((x) => x.slug === s.slug);
  const previous = index > 0 ? siblings[index - 1] : undefined;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : undefined;
  const related = allSolutions(s.citation.book)
    .filter((x) => x !== s && x.access !== "coming-soon" && x.topics.some((t) => s.topics.includes(t)))
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-comic-paper text-comic-ink dark:bg-comic-ink dark:text-comic-paper">
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm font-bold">
          <Link href={bookHref(book.id)} className="underline decoration-2 underline-offset-4">
            {book.breadcrumbLabel}
          </Link>
          <span aria-hidden="true"> / </span>
          <Link href={chapterHref(chapter.slug, book.id)} className="underline decoration-2 underline-offset-4">
            Ch {chapter.number} {chapter.title}
          </Link>
        </nav>
        <header className="mb-6 max-w-4xl">
          <TiltLabel tilt={-1} tone={s.sample ? "violet" : "yellow"}>
            {citationText(s)}
          </TiltLabel>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{s.title}</h1>
          <p className="mt-3 text-lg font-bold leading-relaxed">
            <span className="mr-2 border-2 border-comic-ink bg-comic-paper px-1.5 text-sm uppercase text-comic-ink">In short</span>
            {s.inShort}
          </p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Given values">
            {s.given.map((g) => (
              <li
                key={g.key}
                className="math-inline border-2 border-comic-ink bg-comic-paper px-2.5 py-1 font-bold text-comic-ink shadow-neo-sm"
                dangerouslySetInnerHTML={{ __html: renderMath(givenTex(g)) }}
              />
            ))}
          </ul>
        </header>

        <SolutionLab payload={payload} posters={posters} />

        {locked ? (
          <div className="mt-8 max-w-2xl border-[3px] border-comic-ink bg-comic-paper p-6 text-comic-ink shadow-neo">
            <TiltLabel tone="violet" tilt={2}>
              SciFunLab Plus
            </TiltLabel>
            <p className="mt-3 text-lg font-bold">The full 3D solution for this question is coming with SciFunLab Plus.</p>
          </div>
        ) : null}

        <footer className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="flex flex-wrap gap-3">
            {previous ? (
              <Link href={questionHref(previous)} className="border-[3px] border-comic-ink bg-comic-paper px-4 py-2 font-black text-comic-ink shadow-neo-sm">
                ← {citationLabel(previous.citation)}
              </Link>
            ) : null}
            {next ? (
              <Link href={questionHref(next)} className="border-[3px] border-comic-ink bg-comic-paper px-4 py-2 font-black text-comic-ink shadow-neo-sm">
                {citationLabel(next.citation)} →
              </Link>
            ) : null}
            {s.relatedLab ? (
              <Link href={s.relatedLab} className="border-[3px] border-comic-ink bg-comic-green px-4 py-2 font-black text-comic-ink shadow-neo-sm">
                Try the lab →
              </Link>
            ) : null}
          </div>
          {related.length > 0 ? (
            <div>
              <h2 className="font-black">Same topic</h2>
              <ul className="mt-2 space-y-1">
                {related.map((r) => (
                  <li key={questionHref(r)}>
                    <Link href={questionHref(r)} className="underline decoration-2 underline-offset-4">
                      Ch {r.citation.chapter} · {citationLabel(r.citation)} · {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </footer>
        {credits.length > 0 ? (
          <aside className="mt-8 border-[3px] border-dashed border-comic-ink bg-comic-paper p-4 text-sm text-comic-ink shadow-neo-sm">
            <span className="font-mono text-xs font-black uppercase tracking-wider">Open-Source Credits:</span>{" "}
            <ul className="mt-2 inline-flex flex-wrap gap-2">
              {credits.map((credit) => {
                const validHandle = credit.github && GITHUB_HANDLE_RE.test(credit.github) ? credit.github : undefined;
                return (
                  <li key={`${credit.name}-${credit.github ?? ""}`} className="border-2 border-comic-ink bg-comic-yellow px-2 py-0.5 font-bold text-comic-ink">
                    {validHandle ? (
                      <a
                        href={`https://github.com/${validHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-2 underline-offset-2"
                      >
                        {credit.name} (@{validHandle})
                      </a>
                    ) : (
                      credit.name
                    )}
                    {credit.role ? ` · ${credit.role}` : ""}
                  </li>
                );
              })}
            </ul>
          </aside>
        ) : null}
      </div>
    </main>
  );
}

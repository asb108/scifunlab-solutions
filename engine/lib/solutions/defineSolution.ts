import { boardLineText } from "@/lib/solutions/board";
import { bookCatalogById } from "@/lib/solutions/books/catalog";
import { challengeBest } from "@/lib/solutions/challenge";
import { kitDefinitions } from "@/lib/solutions/kits/models";
import { modelWithTune } from "@/lib/solutions/kits/types";
import { questionSlug } from "@/lib/solutions/routes";
import type { GivenValue, Solution, SolutionInput } from "@/lib/solutions/types";

export function givenNumbers(given: GivenValue[]): Record<string, number> {
  return Object.fromEntries(given.map((g) => [g.key, g.value]));
}

const BOARD_LIMIT = 38;

/**
 * Normalise a solution file and check it against its kit. Any mistake throws
 * with the solution's slug, so a broken file fails `next build` instead of
 * breaking a student's page at runtime.
 */
export function defineSolution(input: SolutionInput): Solution {
  const book = bookCatalogById[input.citation.book];
  if (!book) {
    throw new Error(`Unknown book "${input.citation.book}" in citation`);
  }
  const chapter = book.chapters.find((c) => c.number === input.citation.chapter);
  if (!chapter) {
    throw new Error(`${book.title} has no chapter ${input.citation.chapter}`);
  }
  const slug = questionSlug(input.citation);
  const id = `${book.id}/${chapter.slug}/${slug}`;
  const fail = (message: string): never => {
    throw new Error(`${id}: ${message}`);
  };

  if (input.citation.volume !== chapter.volume) fail(`chapter ${chapter.number} is in volume ${chapter.volume}`);
  if (input.steps.length === 0) fail("needs at least one step");
  if (input.access === "subscriber" && input.steps.length < 2) {
    fail("a subscriber solution needs at least 2 steps (step 1 is the free preview)");
  }

  const given: GivenValue[] = Object.entries(input.given).map(([key, [value, unit, labelTex]]) => ({
    key,
    value,
    unit,
    labelTex: labelTex ?? key,
  }));

  const kit = input.kit === "custom" ? undefined : kitDefinitions[input.kit];
  if (input.kit !== "custom" && !kit) fail(`kit "${input.kit}" is not registered`);

  if (kit) {
    const objects = new Set(kit.objects);
    const numbers = givenNumbers(given);
    const model = kit.model(numbers, input.kitParams);

    // Values the board may reference: kit outputs at book values, plus the
    // given numbers themselves.
    const outputValues = Object.fromEntries(Object.entries(kit.outputs).map(([name, fn]) => [name, fn(model)]));
    const boardValues: Record<string, number> = { ...numbers, ...outputValues };

    input.steps.forEach((step, index) => {
      const where = `step ${index + 1} ("${step.title}")`;
      for (const name of [...step.cue.show, ...(step.cue.highlight ?? [])]) {
        if (!objects.has(name)) fail(`${where} names unknown object "${name}" for kit ${kit.id}`);
      }
      const at = step.cue.at;
      if (typeof at === "string" && !(at in model.times)) {
        fail(`${where} rests at unknown time "${at}" (kit ${kit.id} has ${Object.keys(model.times).join(", ")})`);
      }
      if (step.cue.focus && !(step.cue.focus in kit.focuses)) {
        fail(`${where} focuses on unknown view "${step.cue.focus}" (kit ${kit.id} has ${Object.keys(kit.focuses).join(", ")})`);
      }
      const linkSource = `${step.board.join(" ")} ${step.predict?.reveal ?? ""}`;
      for (const [, name] of linkSource.matchAll(/\[\[([a-zA-Z0-9_]+)\|/g)) {
        if (!objects.has(name)) fail(`${where} links to unknown object "${name}" for kit ${kit.id}`);
      }
      if (step.predict && (step.predict.answer < 0 || step.predict.answer >= step.predict.options.length)) {
        fail(`${where} predict answer ${step.predict.answer} is not one of its options`);
      }
      step.board.forEach((line, lineIndex) => {
        let text = "";
        try {
          text = boardLineText(line, boardValues);
        } catch (error) {
          fail(`${where} board line ${lineIndex + 1}: ${(error as Error).message}`);
        }
        if (text.length > BOARD_LIMIT) {
          fail(`${where} board line ${lineIndex + 1} is ${text.length} characters, over the ${BOARD_LIMIT}-character limit: "${text}"`);
        }
      });
    });

    if (input.guess !== "none" && !(input.guess.use in kit.guesses)) {
      fail(`guess uses unknown "${input.guess.use}" (kit ${kit.id} has ${Object.keys(kit.guesses).join(", ")})`);
    }

    if (input.whatIf) {
      if (!(input.whatIf.tune in kit.tunables)) {
        fail(`what-if tunes unknown "${input.whatIf.tune}" (kit ${kit.id} has ${Object.keys(kit.tunables).join(", ")})`);
      }
      const challenge = input.whatIf.challenge;
      if (challenge) {
        if (!(challenge.of in kit.outputs)) {
          fail(`what-if challenge references unknown output "${challenge.of}" (kit ${kit.id} has ${Object.keys(kit.outputs).join(", ")})`);
        }
        const tunable = kit.tunables[input.whatIf.tune];
        if (tunable && (challenge.kind === "max" || challenge.kind === "min")) {
          const evaluate = (tune: number) => kit.outputs[challenge.of](modelWithTune(kit, numbers, input.kitParams, input.whatIf!.tune, tune));
          const best = challengeBest(evaluate, { min: tunable.min, max: tunable.max, step: tunable.step }, challenge.kind);
          const edge = tunable.step / 2;
          if (best.tune <= tunable.min + edge || best.tune >= tunable.max - edge) {
            fail(`what-if challenge's best "${challenge.of}" sits at the edge of its tunable's range, not inside it`);
          }
        }
      }
    }
  }

  return { ...input, given, slug, chapterSlug: chapter.slug };
}

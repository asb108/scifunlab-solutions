import type { Citation, SectionId, Solution } from "@/lib/solutions/types";

export const SOLUTIONS_ROOT = "/solutions";

export function bookHref(bookId: string): string {
  return `${SOLUTIONS_ROOT}/${bookId}`;
}

/** "exercise-12", "objective-2-4", "short-answer-7", "sample-1". */
export function questionSlug(citation: Pick<Citation, "section" | "number">): string {
  return `${citation.section}-${citation.number}`;
}

export function chapterHref(chapterSlug: string, bookId = "hc-verma"): string {
  return `${bookHref(bookId)}/${chapterSlug}`;
}

export function questionHref(
  solution: Pick<Solution, "chapterSlug" | "slug"> & { citation?: Pick<Citation, "book"> },
): string {
  return `${chapterHref(solution.chapterSlug, solution.citation?.book ?? "hc-verma")}/${solution.slug}`;
}

export const sectionLabels: Record<SectionId, string> = {
  "short-answer": "Questions for Short Answer",
  "objective-1": "Objective I",
  "objective-2": "Objective II",
  exercise: "Exercises",
  sample: "Samples",
};

/** Short form used in citations, e.g. "Exercise 12", "Objective II Q4". */
export function citationLabel(citation: Pick<Citation, "section" | "number">): string {
  switch (citation.section) {
    case "exercise":
      return `Exercise ${citation.number}`;
    case "objective-1":
      return `Objective I Q${citation.number}`;
    case "objective-2":
      return `Objective II Q${citation.number}`;
    case "short-answer":
      return `Short answer Q${citation.number}`;
    case "sample":
      return `Sample ${citation.number}`;
  }
}

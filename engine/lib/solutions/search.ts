import type { Chapter } from "@/lib/solutions/books/types";
import { chapterHref, citationLabel, questionHref } from "@/lib/solutions/routes";
import type { Access, SectionId, Solution } from "@/lib/solutions/types";

export interface SearchEntry {
  kind: "chapter" | "solution";
  chapter: number;
  volume: 1 | 2;
  href: string;
  label: string;
  topics: string[];
  section?: SectionId;
  number?: number;
  access?: Access;
  difficulty?: 1 | 2 | 3;
}

export interface SearchFilters {
  volume?: 1 | 2;
  topic?: string;
  difficulty?: 1 | 2 | 3;
  freeOnly?: boolean;
}

const SECTION_ORDER: SectionId[] = ["exercise", "objective-1", "objective-2", "short-answer", "sample"];

export function buildSearchIndex(
  chapters: readonly Chapter[],
  solutions: Solution[],
  bookId = "hc-verma",
): SearchEntry[] {
  const entries: SearchEntry[] = chapters.map((c) => ({
    kind: "chapter",
    chapter: c.number,
    volume: c.volume,
    href: chapterHref(c.slug, bookId),
    label: `Ch ${c.number} · ${c.title}`,
    topics: c.topics,
  }));
  for (const s of solutions) {
    if (s.access === "coming-soon") continue;
    entries.push({
      kind: "solution",
      chapter: s.citation.chapter,
      volume: s.citation.volume,
      href: questionHref(s),
      label: `Ch ${s.citation.chapter} · ${citationLabel(s.citation)} · ${s.title}`,
      topics: s.topics,
      section: s.citation.section,
      number: s.citation.number,
      access: s.access,
      difficulty: s.difficulty,
    });
  }
  return entries;
}

const QUESTION_PATTERN = /^(?:ch\s*)?(\d{1,2})\s*[.\s:]\s*(?:q\s*)?(\d{1,3})$/;
const CHAPTER_PATTERN = /^(?:ch\s*)?(\d{1,2})$/;

function bySection(a: SearchEntry, b: SearchEntry): number {
  const sa = a.section ? SECTION_ORDER.indexOf(a.section) : -1;
  const sb = b.section ? SECTION_ORDER.indexOf(b.section) : -1;
  return sa - sb || (a.number ?? 0) - (b.number ?? 0);
}

function applyFilters(matches: SearchEntry[], index: SearchEntry[], filters: SearchFilters): SearchEntry[] {
  const solutionOk = (e: SearchEntry): boolean => {
    if (filters.topic && !e.topics.includes(filters.topic)) return false;
    if (filters.difficulty && e.difficulty !== filters.difficulty) return false;
    if (filters.freeOnly && e.access !== "free") return false;
    return true;
  };
  const needsSolution = Boolean(filters.difficulty || filters.freeOnly);
  return matches.filter((e) => {
    if (filters.volume && e.volume !== filters.volume) return false;
    if (e.kind === "solution") return solutionOk(e);
    if (filters.topic && !e.topics.includes(filters.topic)) {
      // A chapter also passes when one of its solutions carries the topic.
      const viaSolution = index.some((s) => s.kind === "solution" && s.chapter === e.chapter && s.topics.includes(filters.topic as string));
      if (!viaSolution) return false;
    }
    if (needsSolution) {
      return index.some((s) => s.kind === "solution" && s.chapter === e.chapter && solutionOk(s));
    }
    return true;
  });
}

export function matchQuery(index: SearchEntry[], query: string, filters: SearchFilters): SearchEntry[] {
  const q = query.trim().toLowerCase();
  let matches: SearchEntry[];

  const qm = QUESTION_PATTERN.exec(q);
  const cm = qm ? null : CHAPTER_PATTERN.exec(q);
  if (qm) {
    const chapter = Number(qm[1]);
    const number = Number(qm[2]);
    matches = index.filter((e) => e.kind === "solution" && e.chapter === chapter && e.number === number).sort(bySection);
  } else if (cm) {
    const chapter = Number(cm[1]);
    const chapterEntries = index.filter((e) => e.kind === "chapter" && e.chapter === chapter);
    const solutionEntries = index.filter((e) => e.kind === "solution" && e.chapter === chapter).sort(bySection);
    matches = [...chapterEntries, ...solutionEntries];
  } else if (q === "") {
    matches = index.filter((e) => e.kind === "chapter");
  } else {
    const hit = (e: SearchEntry) =>
      e.label.toLowerCase().includes(q) || e.topics.some((t) => t.replace(/-/g, " ").includes(q));
    matches = [
      ...index.filter((e) => e.kind === "chapter" && hit(e)),
      ...index.filter((e) => e.kind === "solution" && hit(e)),
    ];
  }
  return applyFilters(matches, index, filters);
}

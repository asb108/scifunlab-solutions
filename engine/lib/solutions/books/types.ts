/**
 * Shared types and helpers for textbook definitions under `lib/solutions/books/`.
 */

export type ChapterGroup =
  | "mechanics"
  | "waves"
  | "optics"
  | "thermal"
  | "electricity"
  | "magnetism"
  | "modern";

export interface Chapter {
  number: number;
  volume: 1 | 2;
  title: string;
  slug: string;
  group: ChapterGroup;
  topics: string[];
}

export interface BookDefinition {
  /** URL slug under `/solutions/<id>` (for example `"hc-verma"`). */
  id: string;
  /** Short card heading shown in the solutions hub. */
  title: string;
  /** Book subtitle shown under the heading. */
  subtitle: string;
  /** Small tilted badge on the book hub card (for example `"Vols 1 and 2"`). */
  badge: string;
  /** Hub card summary copy (written in our own words). */
  summary: string;
  /** Browser hero label and description. */
  heroLabel: string;
  heroHeading: string;
  heroDescription: string;
  /** Metadata strings for SEO while keeping canonical URLs stable. */
  hubTitle: string;
  hubDescription: string;
  chapterTitlePrefix: string;
  questionTitlePrefix: string;
  breadcrumbLabel: string;
  /** Ordered chapter map for this textbook. */
  chapters: readonly Chapter[];
}

export function chapterSlug(number: number, title: string): string {
  const kebab = title
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `ch-${String(number).padStart(2, "0")}-${kebab}`;
}

export function defineBook(book: BookDefinition): BookDefinition {
  if (!/^[a-z0-9-]+$/.test(book.id)) {
    throw new Error(`Book id "${book.id}" must be lowercase kebab-case`);
  }
  if (book.chapters.length === 0) {
    throw new Error(`Book "${book.id}" needs at least one chapter`);
  }
  return book;
}

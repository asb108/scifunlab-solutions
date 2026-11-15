import { allBookCatalog, bookCatalogById } from "@/lib/solutions/books/catalog";
import { allBookSolutions } from "@/lib/solutions/books/solutions";
import type { BookDefinition, Chapter } from "@/lib/solutions/books/types";
import type { SectionId, Solution } from "@/lib/solutions/types";

const sectionOrder: SectionId[] = ["exercise", "objective-1", "objective-2", "short-answer", "sample"];

function compare(a: Solution, b: Solution): number {
  return (
    a.citation.book.localeCompare(b.citation.book) ||
    a.citation.chapter - b.citation.chapter ||
    sectionOrder.indexOf(a.citation.section) - sectionOrder.indexOf(b.citation.section) ||
    a.citation.number - b.citation.number
  );
}

export function allBooks(): readonly BookDefinition[] {
  return allBookCatalog;
}

export function bookById(bookId: string): BookDefinition | undefined {
  return bookCatalogById[bookId];
}

export function bookChapterBySlug(book: BookDefinition, slug: string): Chapter | undefined {
  return book.chapters.find((chapter) => chapter.slug === slug);
}

export function allSolutions(bookId?: string): Solution[] {
  const list = bookId ? allBookSolutions.filter((s) => s.citation.book === bookId) : allBookSolutions;
  return [...list].sort(compare);
}

export function solutionByRoute(bookId: string, chapterSlug: string, slug: string): Solution | undefined {
  return allBookSolutions.find(
    (s) => s.citation.book === bookId && s.chapterSlug === chapterSlug && s.slug === slug,
  );
}

export function solutionBySlug(chapterSlug: string, slug: string): Solution | undefined {
  return allBookSolutions.find((s) => s.chapterSlug === chapterSlug && s.slug === slug);
}

export function solutionsForChapter(chapter: number, bookId?: string): Solution[] {
  return allSolutions(bookId).filter((s) => s.citation.chapter === chapter);
}

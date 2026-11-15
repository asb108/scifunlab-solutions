import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ComicPageHero } from "@/components/comic/ComicPageHero";
import { ComicPanel } from "@/components/comic/ComicPanel";
import { TiltLabel } from "@/components/comic/TiltLabel";
import { allBooks, bookById, bookChapterBySlug, solutionsForChapter } from "@/lib/solutions/registry";
import { bookHref, chapterHref, citationLabel, questionHref, sectionLabels } from "@/lib/solutions/routes";
import type { Access, SectionId, Solution } from "@/lib/solutions/types";

import { StampCount } from "./StampCount";

export const dynamicParams = false;

export function generateStaticParams() {
  return allBooks().flatMap((book) =>
    book.chapters.map((chapter) => ({ book: book.id, chapter: chapter.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>;
}): Promise<Metadata> {
  const { book: bookId, chapter: slug } = await params;
  const book = bookById(bookId);
  const chapter = book ? bookChapterBySlug(book, slug) : undefined;
  if (!book || !chapter) return {};
  return {
    title: `${book.chapterTitlePrefix} Ch ${chapter.number}: ${chapter.title} solutions in 3D`,
    description: `Step-by-step 3D solutions for ${book.chapterTitlePrefix} ${book.subtitle}, chapter ${chapter.number}: ${chapter.title}.`,
    alternates: { canonical: `https://www.scifunlab.com${chapterHref(chapter.slug, book.id)}` },
  };
}

const SECTION_ORDER: SectionId[] = ["exercise", "objective-1", "objective-2", "short-answer", "sample"];

const BADGE: Record<Access, { text: string; className: string }> = {
  free: { text: "Free", className: "bg-comic-yellow text-comic-ink" },
  subscriber: { text: "Plus", className: "bg-comic-violet text-comic-paper" },
  "coming-soon": { text: "Soon", className: "bg-comic-ink text-comic-paper" },
};

function Pips({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span aria-label={`Difficulty ${level} of 3`} role="img" className="font-black tracking-widest">
      {"●".repeat(level)}
      {"○".repeat(3 - level)}
    </span>
  );
}

function Row({ solution }: { solution: Solution }) {
  const badge = BADGE[solution.access];
  const body = (
    <>
      <span className="min-w-[8rem] font-black">{citationLabel(solution.citation)}</span>
      <span className="order-last w-full min-w-0 font-bold sm:order-none sm:w-auto sm:flex-1">{solution.inShort}</span>
      <Pips level={solution.difficulty} />
      <span className="font-mono text-xs font-bold uppercase">{solution.kit}</span>
      {solution.access === "coming-soon" ? null : (
        <StampCount id={`${solution.chapterSlug}/${solution.slug}`} total={solution.whatIf?.challenge ? 3 : 2} />
      )}
      <span className={`border-2 border-comic-ink px-2 py-0.5 text-xs font-black uppercase ${badge.className}`}>
        {badge.text}
      </span>
    </>
  );
  const base =
    "flex min-h-[44px] flex-wrap items-center gap-x-4 gap-y-1 border-[3px] border-comic-ink bg-comic-paper px-4 py-2 text-comic-ink shadow-neo-sm";
  if (solution.access === "coming-soon") return <div className={`${base} opacity-70`}>{body}</div>;
  return (
    <Link
      href={questionHref(solution)}
      className={`${base} transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-comic-violet`}
    >
      {body}
    </Link>
  );
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>;
}) {
  const { book: bookId, chapter: slug } = await params;
  const book = bookById(bookId);
  const chapter = book ? bookChapterBySlug(book, slug) : undefined;
  if (!book || !chapter) notFound();

  const solutions = solutionsForChapter(chapter.number, book.id);
  const sections = SECTION_ORDER.filter((s) => solutions.some((q) => q.citation.section === s));

  return (
    <main className="min-h-screen bg-comic-paper text-comic-ink dark:bg-comic-ink dark:text-comic-paper">
      <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-10">
        <div className="px-5 pt-6 sm:px-8">
          <Link
            href={bookHref(book.id)}
            className="inline-flex min-h-[44px] items-center font-black underline decoration-4 underline-offset-4 focus-visible:outline focus-visible:outline-4 focus-visible:outline-comic-violet"
          >
            ← All chapters
          </Link>
        </div>
        <ComicPageHero
          label={`Vol ${chapter.volume} · Chapter ${chapter.number}`}
          heading={chapter.title}
        >
          <ul className="mt-4 flex flex-wrap gap-2">
            {chapter.topics.map((t) => (
              <li key={t}>
                <TiltLabel tone="yellow" className="normal-case">
                  {t.replace(/-/g, " ")}
                </TiltLabel>
              </li>
            ))}
          </ul>
        </ComicPageHero>

        <div className="px-5 sm:px-8">
          {solutions.length === 0 ? (
            <ComicPanel className="p-6">
              <p className="text-2xl font-black">Mapped, coming soon.</p>
              <p className="mt-2 font-bold">Solutions for this chapter are on the way.</p>
            </ComicPanel>
          ) : (
            <>
              <nav aria-label="Sections" className="flex flex-wrap gap-3">
                {sections.map((s) => (
                  <a
                    key={s}
                    href={`#${s}`}
                    className="inline-flex min-h-[44px] items-center border-[3px] border-comic-ink bg-comic-paper px-4 font-black text-comic-ink shadow-neo-sm focus-visible:outline focus-visible:outline-4 focus-visible:outline-comic-violet"
                  >
                    {sectionLabels[s]}
                  </a>
                ))}
              </nav>
              {sections.map((s) => (
                <section key={s} id={s} aria-labelledby={`${s}-heading`} className="mt-10 scroll-mt-24">
                  <h2 id={`${s}-heading`} className="text-3xl font-black">
                    {sectionLabels[s]}
                  </h2>
                  <ul className="mt-4 grid gap-3">
                    {solutions
                      .filter((q) => q.citation.section === s)
                      .map((q) => (
                        <li key={q.slug}>
                          <Row solution={q} />
                        </li>
                      ))}
                  </ul>
                </section>
              ))}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

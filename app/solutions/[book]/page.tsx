import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ComicPageHero } from "@/components/comic/ComicPageHero";
import { TiltLabel } from "@/components/comic/TiltLabel";
import type { ChapterGroup } from "@/lib/solutions/books/types";
import { allBooks, allSolutions, bookById } from "@/lib/solutions/registry";
import { bookHref, chapterHref, citationLabel, questionHref } from "@/lib/solutions/routes";
import { buildSearchIndex } from "@/lib/solutions/search";

import { BrowserSearch } from "./BrowserSearch";

export const dynamicParams = false;

export function generateStaticParams() {
  return allBooks().map((book) => ({ book: book.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ book: string }> }): Promise<Metadata> {
  const { book: bookId } = await params;
  const book = bookById(bookId);
  if (!book) return {};
  return {
    title: book.hubTitle,
    description: book.hubDescription,
    alternates: { canonical: `https://www.scifunlab.com${bookHref(book.id)}` },
  };
}

const GROUP_TINT: Record<ChapterGroup, string> = {
  mechanics: "bg-[#FFF4B8]",
  waves: "bg-[#DCFCE7]",
  optics: "bg-[#EDE9FE]",
  thermal: "bg-[#FFE4E6]",
  electricity: "bg-[#FEF08A]",
  magnetism: "bg-[#E0E7FF]",
  modern: "bg-[#D1FAE5]",
};

export default async function BookBrowserPage({ params }: { params: Promise<{ book: string }> }) {
  const { book: bookId } = await params;
  const book = bookById(bookId);
  if (!book) notFound();

  const solutions = allSolutions(book.id);
  const readySolutions = solutions.filter((s) => s.access !== "coming-soon");
  const index = buildSearchIndex(book.chapters, solutions, book.id);
  const topics = [...new Set(book.chapters.flatMap((c) => c.topics).concat(solutions.flatMap((s) => s.topics)))].sort();
  const volumes = [...new Set(book.chapters.map((c) => c.volume))].sort((a, b) => a - b);

  const progress = (chapter: number) => {
    const open = readySolutions.filter((s) => s.citation.chapter === chapter);
    return { solved: open.length, free: open.filter((s) => s.access === "free").length };
  };

  return (
    <main className="min-h-screen bg-comic-paper text-comic-ink dark:bg-comic-ink dark:text-comic-paper">
      <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-10">
        <div className="px-5 pt-6 sm:px-8">
          <Link
            href="/solutions"
            className="inline-flex min-h-[44px] items-center font-black underline decoration-4 underline-offset-4 focus-visible:outline focus-visible:outline-4 focus-visible:outline-comic-violet"
          >
            ← All 3D books
          </Link>
        </div>
        <ComicPageHero
          label={book.heroLabel}
          heading={book.heroHeading}
          description={book.heroDescription}
        />
        <BrowserSearch index={index} topics={topics} volumes={volumes} />
        {readySolutions.length > 0 ? (
          <section aria-labelledby="ready-3d-heading" className="mt-8 px-5 sm:px-8">
            <div className="border-[3px] border-comic-ink bg-[#14183A] p-5 text-white shadow-neo">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border-2 border-comic-ink bg-comic-yellow px-2 py-0.5 font-mono text-xs font-black uppercase text-comic-ink">
                    Live Now
                  </span>
                  <h2 id="ready-3d-heading" className="font-comic text-2xl uppercase tracking-wide text-white">
                    Try Interactive 3D Labs
                  </h2>
                </div>
                <span className="font-mono text-xs font-bold uppercase text-comic-yellow">
                  {readySolutions.length} playable scenes ready
                </span>
              </div>
              <ul className="mt-4 grid gap-4 md:grid-cols-3">
                {readySolutions.map((solution) => (
                  <li key={questionHref(solution)}>
                    <Link
                      href={questionHref(solution)}
                      className="flex h-full min-h-[44px] flex-col justify-between border-[3px] border-comic-ink bg-comic-paper p-4 text-comic-ink shadow-neo-sm transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-comic-yellow"
                    >
                      <div>
                        <span className="inline-block border-2 border-comic-ink bg-comic-violet px-2 py-0.5 font-mono text-[11px] font-black uppercase text-white">
                          Ch {solution.citation.chapter} · {citationLabel(solution.citation)}
                        </span>
                        <h3 className="mt-2 text-lg font-black leading-snug">{solution.title}</h3>
                        <p className="mt-1.5 text-sm font-semibold text-slate-700">{solution.inShort}</p>
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1 font-mono text-xs font-black uppercase text-comic-violet">
                        Open 3D Lab →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
        {volumes.map((volume) => (
          <section key={volume} aria-labelledby={`volume-${volume}`} className="mt-10 px-5 sm:px-8">
            <h2 id={`volume-${volume}`} className="text-3xl font-black">
              Volume {volume}
            </h2>
            <ul className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {book.chapters
                .filter((c) => c.volume === volume)
                .map((c, i) => {
                  const { solved, free } = progress(c.number);
                  return (
                    <li key={c.slug}>
                      <Link
                        href={chapterHref(c.slug, book.id)}
                        className={`group block h-full border-[3px] border-comic-ink p-5 text-comic-ink shadow-neo transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-comic-violet ${GROUP_TINT[c.group]}`}
                      >
                        <TiltLabel tone="ink" tilt={i % 2 === 0 ? -1 : 1}>
                          Ch {c.number}
                        </TiltLabel>
                        <p className="mt-3 font-comic text-5xl">{c.number}</p>
                        <h3 className="mt-2 text-xl font-black">{c.title}</h3>
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {c.topics.slice(0, 4).map((t) => (
                            <li key={t} className="border-2 border-comic-ink bg-comic-paper px-2 py-0.5 text-xs font-bold">
                              {t.replace(/-/g, " ")}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-4 text-sm font-bold">
                          {solved === 0
                            ? "Mapped · solutions soon"
                            : `${solved} solved · ${free} free`}
                        </p>
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

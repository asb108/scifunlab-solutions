import type { Metadata } from "next";
import Link from "next/link";

import { ComicPageHero } from "@/components/comic/ComicPageHero";
import { TapedCard } from "@/components/comic/TapedCard";
import { TiltLabel } from "@/components/comic/TiltLabel";
import { allBooks, allSolutions } from "@/lib/solutions/registry";
import { bookHref } from "@/lib/solutions/routes";

export const metadata: Metadata = {
  title: "Book solutions in 3D",
  description:
    "Step-by-step physics solutions you can rotate, replay and explore in 3D, starting with HC Verma's Concepts of Physics.",
  alternates: { canonical: "https://www.scifunlab.com/solutions" },
};

const CARD_TINTS = ["bg-[#FFF4B8]", "bg-[#E0E7FF]", "bg-[#DCFCE7]", "bg-[#FFE4E6]"] as const;

export default function SolutionsHub() {
  const books = allBooks();
  const readySolutions = allSolutions().filter((s) => s.access !== "coming-soon");

  return (
    <main className="min-h-screen bg-comic-paper text-comic-ink dark:bg-comic-ink dark:text-comic-paper">
      <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-10">
        <ComicPageHero
          label="Book solutions"
          heading="Solved in 3D"
          description="Pick a book. Every solution plays as a 3D scene you can rotate, step through and replay."
        />
        <div className="grid gap-8 px-5 sm:grid-cols-2 sm:px-8">
          {books.map((book, index) => {
            const solvedCount = readySolutions.filter((s) => s.citation.book === book.id).length;
            return (
              <Link
                key={book.id}
                href={bookHref(book.id)}
                className="group block focus-visible:outline focus-visible:outline-4 focus-visible:outline-comic-violet"
              >
                <TapedCard
                  tilt={index % 2 === 0 ? -1 : 1}
                  tint={`${CARD_TINTS[index % CARD_TINTS.length]} text-comic-ink`}
                  className="p-6 transition-transform group-hover:-translate-y-1"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <TiltLabel tone="violet" tilt={2}>
                      {book.badge}
                    </TiltLabel>
                    {solvedCount > 0 ? (
                      <span className="border-2 border-comic-ink bg-comic-green px-2 py-0.5 font-mono text-xs font-black text-comic-ink">
                        {solvedCount} live in 3D
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-4 text-3xl font-black">{book.title}</h2>
                  <p className="mt-1 font-bold">{book.subtitle}</p>
                  <p className="mt-4 leading-relaxed">{book.summary}</p>
                  <span className="mt-6 inline-block border-[3px] border-comic-ink bg-comic-paper px-4 py-2 font-black text-comic-ink shadow-neo-sm">
                    Browse chapters →
                  </span>
                </TapedCard>
              </Link>
            );
          })}
          {books.length === 1 ? (
            <TapedCard tilt={1} className="p-6 text-comic-ink opacity-90">
              <h2 className="text-2xl font-black">More books &amp; community labs</h2>
              <p className="mt-3 leading-relaxed">
                Other popular physics books will follow once HC Verma is in good shape — open-source solution packs and
                new 3D benches plug straight into this catalog.
              </p>
            </TapedCard>
          ) : null}
        </div>
      </div>
    </main>
  );
}

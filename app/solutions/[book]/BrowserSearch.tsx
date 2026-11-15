"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";

import { matchQuery, type SearchEntry } from "@/lib/solutions/search";

export interface BrowserSearchProps {
  index: SearchEntry[];
  topics: string[];
  volumes?: readonly (1 | 2)[];
}

const FIELD =
  "min-h-[44px] border-[3px] border-comic-ink bg-comic-paper px-3 font-bold text-comic-ink shadow-neo-sm";
const LABEL = "block text-sm font-black uppercase tracking-wide";
const MAX_RESULTS = 30;

export function BrowserSearch({ index, topics, volumes = [1, 2] }: BrowserSearchProps) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [volume, setVolume] = useState<1 | 2 | undefined>(undefined);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | undefined>(undefined);
  const [freeOnly, setFreeOnly] = useState(false);

  const active = query.trim() !== "" || volume !== undefined || topic !== "" || difficulty !== undefined || freeOnly;
  const results = useMemo(
    () =>
      active
        ? matchQuery(index, query, { volume, topic: topic || undefined, difficulty, freeOnly })
        : [],
    [active, index, query, volume, topic, difficulty, freeOnly],
  );

  const volumeButton = (value: 1 | 2 | undefined, text: string) => (
    <button
      key={text}
      type="button"
      aria-pressed={volume === value}
      onClick={() => setVolume(value)}
      className={`min-h-[44px] min-w-[44px] border-[3px] border-comic-ink px-4 font-black shadow-neo-sm ${
        volume === value ? "bg-comic-yellow text-comic-ink" : "bg-comic-paper text-comic-ink"
      }`}
    >
      {text}
    </button>
  );

  return (
    <section aria-label="Find a question" className="px-5 sm:px-8">
      <div className="border-[3px] border-comic-ink bg-comic-paper p-5 text-comic-ink shadow-neo">
        <label htmlFor={`${id}-q`} className={LABEL}>
          Find a question
        </label>
        <input
          id={`${id}-q`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try 3.12, ch 6 q 4 or projectile"
          autoComplete="off"
          className={`${FIELD} mt-2 w-full`}
        />
        <div className="mt-5 flex flex-wrap items-end gap-5">
          {volumes.length > 1 ? (
            <div role="group" aria-labelledby={`${id}-vol`}>
              <span id={`${id}-vol`} className={LABEL}>
                Volume
              </span>
              <div className="mt-2 flex gap-2">
                {volumeButton(undefined, "All")}
                {volumes.map((v) => volumeButton(v, String(v)))}
              </div>
            </div>
          ) : null}
          <div>
            <label htmlFor={`${id}-topic`} className={LABEL}>
              Topic
            </label>
            <select
              id={`${id}-topic`}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={`${FIELD} mt-2`}
            >
              <option value="">Any topic</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/-/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-diff`} className={LABEL}>
              Difficulty
            </label>
            <select
              id={`${id}-diff`}
              value={difficulty ?? ""}
              onChange={(e) => setDifficulty(e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : undefined)}
              className={`${FIELD} mt-2`}
            >
              <option value="">Any</option>
              <option value="1">1 of 3</option>
              <option value="2">2 of 3</option>
              <option value="3">3 of 3</option>
            </select>
          </div>
          <label htmlFor={`${id}-free`} className="flex min-h-[44px] cursor-pointer items-center gap-2 font-black">
            <input
              id={`${id}-free`}
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="h-6 w-6 accent-comic-violet"
            />
            Free now
          </label>
        </div>
      </div>

      {active ? (
        <div className="mt-5" aria-live="polite">
          {results.length === 0 ? (
            <p className="border-[3px] border-comic-ink bg-comic-paper p-4 font-bold text-comic-ink shadow-neo-sm">
              No match yet. That question may not be solved yet.
            </p>
          ) : (
            <ul className="grid gap-3">
              {results.slice(0, MAX_RESULTS).map((entry) => (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    className="flex min-h-[44px] items-center border-[3px] border-comic-ink bg-comic-paper px-4 py-2 font-black text-comic-ink shadow-neo-sm focus-visible:outline focus-visible:outline-4 focus-visible:outline-comic-violet"
                  >
                    {entry.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}

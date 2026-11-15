/**
 * Runs every defineSolution check (across all books) plus optional unregistered
 * files without a full Next.js build:
 *   npx tsx --conditions=react-server scripts/check-solutions.ts [extra-solution-file.ts ...]
 */
import path from "node:path";
import { pathToFileURL } from "node:url";

import { allBookSolutions } from "../books/solutions";
import { kitDefinitions } from "../kits/models";
import type { ContributorCredit } from "@scifunlab/solution-sdk";

const GITHUB_HANDLE_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

function validateCredits(owner: string, credits: ContributorCredit[] | undefined): void {
  if (!credits) return;
  for (const credit of credits) {
    if (!credit.name.trim()) {
      throw new Error(`${owner}: contributor credit requires a non-empty name`);
    }
    if (credit.github && !GITHUB_HANDLE_RE.test(credit.github)) {
      throw new Error(`${owner}: invalid GitHub handle "${credit.github}"`);
    }
  }
}

async function main() {
  const seen = new Set<string>();
  for (const s of allBookSolutions) {
    const key = `${s.citation.book}/${s.chapterSlug}/${s.slug}`;
    if (seen.has(key)) throw new Error(`Duplicate solution route "${key}"`);
    seen.add(key);
    validateCredits(key, s.credits);
  }
  for (const [kitId, kit] of Object.entries(kitDefinitions)) {
    validateCredits(`kit "${kitId}"`, kit?.credits);
  }

  let count = allBookSolutions.length;
  for (const file of process.argv.slice(2)) {
    await import(pathToFileURL(path.resolve(file)).href);
    count += 1;
  }
  console.log(`OK: ${count} solution(s) passed defineSolution checks`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

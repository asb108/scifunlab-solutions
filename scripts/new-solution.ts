/**
 * Beginner-friendly CLI scaffolder for new open-source textbook solutions.
 *
 * Inspect available books, chapters, and kits:
 *   npm run solutions:new -- --list
 *
 * Scaffold a new solution file and refresh registries:
 *   npm run solutions:new -- \
 *     --book hc-verma --chapter 3 --section exercise --number 45 \
 *     --kit projectile --title "Bank throw into a river boat" \
 *     --name "Your Name" --github your-handle
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { bookCatalogById } from "../books/catalog";
import { kitDefinitions, type RegisteredKitId } from "../kits/models";
import { questionSlug } from "../engine/lib/solutions/routes";
import type { ContributorCredit, SectionId } from "@scifunlab/solution-sdk";
import { runSolutionsRegistry } from "./generate-solutions-registry";

const VALID_SECTIONS: readonly SectionId[] = [
  "exercise",
  "objective-1",
  "objective-2",
  "short-answer",
  "sample",
];

const GITHUB_HANDLE_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

export interface NewSolutionOptions {
  book: string;
  chapter: number;
  section: SectionId;
  number: number;
  kit: string;
  title: string;
  name?: string;
  github?: string;
  role?: ContributorCredit["role"];
  force?: boolean;
}

export function resolveSolutionsDirs(rootDir = process.cwd()): { kitsDir: string; booksDir: string } {
  const mainKits = path.join(rootDir, "lib/solutions/kits");
  const mainBooks = path.join(rootDir, "lib/solutions/books");
  if (fs.existsSync(mainKits) && fs.existsSync(mainBooks)) {
    return { kitsDir: mainKits, booksDir: mainBooks };
  }
  return {
    kitsDir: path.join(rootDir, "kits"),
    booksDir: path.join(rootDir, "books"),
  };
}

export function formatSolutionFilename(section: SectionId, number: number): string {
  return `${section}-${number}.ts`;
}

export function formatChapterFolder(chapter: number): string {
  return `ch-${String(chapter).padStart(2, "0")}`;
}

export function formatInventoryReport(): string {
  const lines: string[] = [];

  lines.push("Available books:");
  for (const book of Object.values(bookCatalogById)) {
    const chNums = book.chapters.map((c) => c.number);
    const minCh = chNums.length ? Math.min(...chNums) : 0;
    const maxCh = chNums.length ? Math.max(...chNums) : 0;
    lines.push(`  - ${book.id}: ${book.title} (${book.subtitle}, Ch ${minCh}-${maxCh})`);
  }

  lines.push("");
  lines.push(`Valid sections: ${VALID_SECTIONS.join(", ")}`);
  lines.push("");
  lines.push("Available kits (for --kit <id>):");

  for (const [kitId, kit] of Object.entries(kitDefinitions)) {
    if (!kit) continue;
    const guessList = Object.entries(kit.guesses)
      .map(([k, g]) => `${k} (${g.handle}, unit "${g.unit || "none"}")`)
      .join(", ");
    const tunableList = Object.entries(kit.tunables)
      .map(([k, t]) => `${k} [${t.min}..${t.max}, step ${t.step}${t.unit ? ` ${t.unit}` : ""}]`)
      .join(", ");
    lines.push(`  - ${kitId}`);
    lines.push(`      objects:  ${kit.objects.join(", ")}`);
    lines.push(`      outputs:  ${Object.keys(kit.outputs).join(", ")}`);
    lines.push(`      guesses:  ${guessList || "none"}`);
    lines.push(`      tunables: ${tunableList || "none"}`);
    lines.push(`      focuses:  ${Object.keys(kit.focuses).join(", ")}`);
  }

  return `${lines.join("\n")}\n`;
}

function buildStarterBlock(kitId: string): {
  inShort: string;
  givenBlock: string;
  guessBlock: string;
  stepsBlock: string;
  whatIfBlock: string;
  answerBlock: string;
} {
  if (kitId === "projectile") {
    return {
      inShort: "TODO: summarize the projectile problem setup in your own original words.",
      givenBlock: [
        `  given: {`,
        `    u: [10, "m/s"],`,
        `    theta: [45, "^\\\\circ", "\\\\theta"],`,
        `    alpha: [0, "^\\\\circ", "\\\\alpha"],`,
        `    h: [0, "m"],`,
        `    g: [9.8, "m/s^2"],`,
        `  }, // TODO: update numerical givens to match the textbook question`,
      ].join("\n"),
      guessBlock: `  guess: { use: "landing", tolerance: 0.35 },`,
      whatIfBlock: [
        `  whatIf: {`,
        `    tune: "theta",`,
        `  },`,
      ].join("\n"),
      stepsBlock: [
        `  steps: [`,
        `    {`,
        `      title: "Resolve initial velocity",`,
        `      board: [`,
        `        "u_x = u cos \\u03b8 = {ux} m/s",`,
        `        "yellow:u_y = u sin \\u03b8 = {uy} m/s",`,
        `      ],`,
        `      cue: { show: ["ground", "ball", "u", "ux", "uy"], highlight: ["ux", "uy"], at: 0, focus: "launch" },`,
        `      describe: "TODO: describe how velocity vectors split at launch.",`,
        `    },`,
        `    {`,
        `      title: "Compute flight time and range",`,
        `      board: [`,
        `        "T = 2 u_y / g = {T} s",`,
        `        "green:((R = {range} m|box)) !tick",`,
        `      ],`,
        `      cue: { show: ["ground", "ball", "path", "landing", "range"], highlight: ["range"], at: "tFlight", focus: "home" },`,
        `      describe: "TODO: describe the curved trajectory landing on the ruler.",`,
        `    },`,
        `  ],`,
      ].join("\n"),
      answerBlock: `  answer: { value: 10.2, unit: "m", label: "Horizontal range" }, // TODO: update answer`,
    };
  }

  if (kitId === "blocks") {
    return {
      inShort: "TODO: summarize the pulley and block setup in your own original words.",
      givenBlock: [
        `  given: {`,
        `    m1: [2, "kg", "m_1"],`,
        `    m2: [1, "kg", "m_2"],`,
        `    alpha: [0, "^\\\\circ", "\\\\alpha"],`,
        `    mu: [0, "", "\\\\mu"],`,
        `    g: [10, "m/s^2"],`,
        `  }, // TODO: update numerical givens to match the textbook question`,
      ].join("\n"),
      guessBlock: `  guess: { use: "dropIn1s", tolerance: 0.25 },`,
      whatIfBlock: [
        `  whatIf: {`,
        `    tune: "m2",`,
        `  },`,
      ].join("\n"),
      stepsBlock: [
        `  steps: [`,
        `    {`,
        `      title: "Write equations for block A",`,
        `      board: [`,
        `        "N = m_1 g cos \\u03b1 = {N} N",`,
        `        "yellow:f = \\u03bc N = {f} N",`,
        `      ],`,
        `      cue: { show: ["incline", "pulley", "string", "blockA", "blockB", "N", "fA", "gA", "T_A"], highlight: ["blockA"], at: 0, focus: "blockA" },`,
        `      describe: "TODO: describe the force arrows on block A.",`,
        `    },`,
        `    {`,
        `      title: "Find acceleration and tension",`,
        `      board: [`,
        `        "T = m_2(g - a) = {T} N",`,
        `        "green:((a = {a} m/s^2|box)) !tick",`,
        `      ],`,
        `      cue: { show: ["incline", "pulley", "string", "blockA", "blockB", "T_B", "gB", "a"], highlight: ["a"], at: "tEnd", focus: "pulley" },`,
        `      describe: "TODO: describe block B falling as tension accelerates block A.",`,
        `    },`,
        `  ],`,
      ].join("\n"),
      answerBlock: `  answer: { value: 3.33, unit: "m/s^2", label: "Acceleration of the blocks" }, // TODO: update answer`,
    };
  }

  if (kitId === "field") {
    return {
      inShort: "TODO: summarize the charge pair and probe point in your own original words.",
      givenBlock: [
        `  given: {`,
        `    q1: [2, "\\\\mu C", "q_1"],`,
        `    x1: [0, "m", "x_1"],`,
        `    q2: [-1, "\\\\mu C", "q_2"],`,
        `    x2: [0.1, "m", "x_2"],`,
        `    px: [0.05, "m", "x_P"],`,
        `    py: [0.05, "m", "y_P"],`,
        `  }, // TODO: update numerical givens to match the textbook question`,
      ].join("\n"),
      guessBlock: `  guess: { use: "direction", tolerance: 12 },`,
      whatIfBlock: [
        `  whatIf: {`,
        `    tune: "x2",`,
        `  },`,
      ].join("\n"),
      stepsBlock: [
        `  steps: [`,
        `    {`,
        `      title: "Compute individual field vectors",`,
        `      board: [`,
        `        "E_1 = {E1} x 10^6 N/C",`,
        `        "yellow:E_2 = {E2} x 10^6 N/C",`,
        `      ],`,
        `      cue: { show: ["charges", "probe", "E1", "E2"], highlight: ["E1"], at: 0, focus: "probe" },`,
        `      describe: "TODO: describe how both source charges produce vectors at the probe.",`,
        `    },`,
        `    {`,
        `      title: "Add vectors for resultant field",`,
        `      board: [`,
        `        "E_net = {Enet} x 10^6 N/C",`,
        `        "green:((angle = {angle}\\u00b0|box)) !tick",`,
        `      ],`,
        `      cue: { show: ["charges", "probe", "E1", "E2", "Enet"], highlight: ["Enet"], at: "tEnd", focus: "home" },`,
        `      describe: "TODO: describe the net electric field arrow at the probe.",`,
        `    },`,
        `  ],`,
      ].join("\n"),
      answerBlock: `  answer: { value: 14.3, unit: "deg", label: "Field direction" }, // TODO: update answer`,
    };
  }

  const kit = kitDefinitions[kitId as RegisteredKitId];
  const firstOutput = kit ? Object.keys(kit.outputs)[0] ?? "answer" : "answer";
  const firstGuess = kit ? Object.keys(kit.guesses)[0] : undefined;
  const firstTunable = kit ? Object.keys(kit.tunables)[0] : undefined;
  const focuses = kit ? Object.keys(kit.focuses) : ["home"];
  const homeFocus = focuses[0] ?? "home";
  const firstObj = kit?.objects[0];
  const cueShow = firstObj ? `[${JSON.stringify(firstObj)}]` : "[]";

  return {
    inShort: "TODO: summarize the problem setup in your own original words.",
    givenBlock: `  given: {}, // TODO: add numerical inputs expected by kits/${kitId}/model.ts`,
    guessBlock: firstGuess
      ? `  guess: { use: ${JSON.stringify(firstGuess)}, tolerance: 0.25 },`
      : `  guess: "none",`,
    whatIfBlock: firstTunable ? `  whatIf: {\n    tune: ${JSON.stringify(firstTunable)},\n  },` : "",
    stepsBlock: [
      `  steps: [`,
      `    {`,
      `      title: "Set up the governing relation",`,
      `      board: [`,
      `        "TODO: add step equation",`,
      `      ],`,
      `      cue: { show: ${cueShow}, at: 0, focus: ${JSON.stringify(homeFocus)} },`,
      `      describe: "TODO: describe what appears on the bench.",`,
      `    },`,
      `    {`,
      `      title: "Evaluate the final value",`,
      `      board: [`,
      `        "green:((result = {${firstOutput}}|box)) !tick",`,
      `      ],`,
      `      cue: { show: ${cueShow}, at: 0, focus: ${JSON.stringify(homeFocus)} },`,
      `      describe: "TODO: describe the final state on the bench.",`,
      `    },`,
      `  ],`,
    ].join("\n"),
    answerBlock: `  answer: { value: 0, unit: "", label: "TODO: answer label" },`,
  };
}

export function renderSolutionTemplate(opts: NewSolutionOptions): string {
  const book = bookCatalogById[opts.book];
  if (!book) {
    throw new Error(`Unknown book "${opts.book}". Available: ${Object.keys(bookCatalogById).join(", ")}`);
  }
  const ch = book.chapters.find((c) => c.number === opts.chapter);
  if (!ch) {
    throw new Error(`Book "${opts.book}" has no chapter ${opts.chapter}.`);
  }
  if (!kitDefinitions[opts.kit as RegisteredKitId]) {
    throw new Error(`Unknown kit "${opts.kit}". Available: ${Object.keys(kitDefinitions).join(", ")}`);
  }

  const starter = buildStarterBlock(opts.kit);
  const creditsBlock = opts.name?.trim()
    ? `  credits: [\n    {\n      name: ${JSON.stringify(opts.name.trim())},${
        opts.github ? `\n      github: ${JSON.stringify(opts.github.trim())},` : ""
      }\n      role: ${JSON.stringify(opts.role ?? "author")},\n    },\n  ],`
    : `  // credits: [{ name: "Your Name", github: "your-github-handle", role: "author" }],`;

  const topics = JSON.stringify(ch.topics.slice(0, 2));

  return [
    `import { defineSolution } from "@scifunlab/solution-sdk";`,
    ``,
    `/**`,
    ` * ${book.title} · Volume ${ch.volume}, Chapter ${ch.number} (${ch.title})`,
    ` * Section: ${opts.section}, Number: ${opts.number}`,
    ` * Kit: ${opts.kit}`,
    ` *`,
    ` * Guidelines:`,
    ` * - Keep all prose and board lines in original words (only givens & numerical answer from book).`,
    ` * - Every chalkboard line must render <= 38 characters; end final line with "!tick".`,
    ` * - Verify with: npm run solutions:check && npm run typecheck && npm run lint`,
    ` */`,
    `export default defineSolution({`,
    `  citation: { book: ${JSON.stringify(opts.book)}, volume: ${ch.volume}, chapter: ${ch.number}, section: ${JSON.stringify(opts.section)}, number: ${opts.number} },`,
    `  title: ${JSON.stringify(opts.title.trim())},`,
    creditsBlock,
    `  inShort: ${JSON.stringify(starter.inShort)},`,
    `  topics: ${topics},`,
    `  difficulty: 2,`,
    `  access: "free",`,
    `  kit: ${JSON.stringify(opts.kit)},`,
    ``,
    starter.givenBlock,
    ``,
    starter.guessBlock,
    starter.whatIfBlock,
    ``,
    starter.stepsBlock,
    ``,
    starter.answerBlock,
    `});`,
    ``,
  ]
    .filter((line) => line !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

function usageText(): string {
  return [
    "Usage:",
    "  npm run solutions:new -- --list",
    "  npm run solutions:new -- --book <id> --chapter <n> [--section <id>] --number <n> --kit <id> --title <text> [--name <author>] [--github <handle>] [--force]",
    "",
    "Options:",
    "  --list              Print all registered books, valid sections, and reusable kits",
    "  --book <id>         Textbook ID (for example: hc-verma)",
    "  --chapter <n>       Chapter number (integer, matched against book catalog)",
    `  --section <id>      One of: ${VALID_SECTIONS.join(", ")} (default: exercise)`,
    "  --number <n>        Question number (positive integer)",
    "  --kit <id>          Kit ID (use --list to inspect available kits)",
    "  --title <text>      Short original title shown on the solution page",
    "  --name <author>     Contributor name for the credits footer badge",
    "  --github <handle>   Optional GitHub handle for credits link",
    "  --force             Overwrite target file if it already exists",
    "  --help              Show this help text",
    "",
  ].join("\n");
}

function readFlag(argv: string[], name: string): string | undefined {
  const idx = argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  const val = argv[idx + 1];
  if (!val || val.startsWith("--")) {
    throw new Error(`Flag --${name} requires a value.`);
  }
  return val;
}

export function createSolutionFile(opts: NewSolutionOptions, rootDir = process.cwd()): {
  filePath: string;
  routeSlug: string;
  updatedRegistries: string[];
} {
  const { kitsDir, booksDir } = resolveSolutionsDirs(rootDir);
  const book = bookCatalogById[opts.book];
  if (!book) {
    throw new Error(`Unknown book "${opts.book}". Available: ${Object.keys(bookCatalogById).join(", ")}`);
  }
  const chapter = book.chapters.find((c) => c.number === opts.chapter);
  if (!chapter) {
    throw new Error(`Book "${opts.book}" does not define chapter ${opts.chapter}.`);
  }
  if (!VALID_SECTIONS.includes(opts.section)) {
    throw new Error(`Invalid section "${opts.section}". Expected one of: ${VALID_SECTIONS.join(", ")}`);
  }
  if (!Number.isInteger(opts.number) || opts.number <= 0) {
    throw new Error(`Question --number must be a positive integer (received ${opts.number}).`);
  }
  if (opts.github && !GITHUB_HANDLE_RE.test(opts.github)) {
    throw new Error(`Invalid GitHub handle "${opts.github}".`);
  }

  const targetDir = path.join(booksDir, opts.book, "solutions", formatChapterFolder(opts.chapter));
  const targetFile = path.join(targetDir, formatSolutionFilename(opts.section, opts.number));
  if (fs.existsSync(targetFile) && !opts.force) {
    throw new Error(`File already exists: ${path.relative(rootDir, targetFile)} (pass --force to overwrite)`);
  }

  const content = renderSolutionTemplate(opts);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetFile, content, "utf8");

  const { updated } = runSolutionsRegistry({ kitsDir, booksDir, mode: "write" });
  const qSlug = questionSlug({ section: opts.section, number: opts.number });
  return {
    filePath: targetFile,
    routeSlug: `/solutions/${opts.book}/${chapter.slug}/${qSlug}`,
    updatedRegistries: updated,
  };
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(usageText());
    return;
  }
  if (argv.includes("--list")) {
    process.stdout.write(formatInventoryReport());
    return;
  }

  const book = readFlag(argv, "book") ?? "";
  const chapterRaw = readFlag(argv, "chapter");
  const sectionRaw = readFlag(argv, "section") ?? "exercise";
  const numberRaw = readFlag(argv, "number");
  const kit = readFlag(argv, "kit") ?? "";
  const title = readFlag(argv, "title") ?? "";
  const name = readFlag(argv, "name");
  const github = readFlag(argv, "github");
  const force = argv.includes("--force");

  if (!book || !chapterRaw || !numberRaw || !kit || !title) {
    process.stderr.write("Missing required flags.\n\n");
    process.stderr.write(usageText());
    process.stderr.write("\nRun `npm run solutions:new -- --list` to inspect books and kits.\n");
    process.exit(1);
  }

  const result = createSolutionFile({
    book,
    chapter: Number(chapterRaw),
    section: sectionRaw as SectionId,
    number: Number(numberRaw),
    kit,
    title,
    name,
    github,
    force,
  });

  const relFile = path.relative(process.cwd(), result.filePath);
  console.log(`Created ${relFile}`);
  if (result.updatedRegistries.length > 0) {
    console.log(`Regenerated ${result.updatedRegistries.length} registry file(s)`);
  }
  console.log(`Preview URL: ${result.routeSlug}`);
  console.log("Next: fill in your TODO values, then run:");
  console.log("  npm run solutions:check && npm run typecheck && npm run lint");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

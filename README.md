# SciFunLab Open Textbook Solutions

Open-source repository for interactive 2D & 3D worked textbook solutions, physics kits, SVG/Canvas diagrams, and animated React Three Fiber benches published on [SciFunLab](https://www.scifunlab.com/solutions).

## Repository Layout

- `books/<book-id>/`: Textbook metadata (`book.ts`), chapter index (`map.ts`), and declarative solution files (`solutions/**/*.ts`).
- `kits/<kit-id>/`: Reusable 2D/3D simulation kits (`model.ts`, `Poster.tsx`, `Bench.tsx`).
- `engine/`: Synced SciFunLab solution viewer, chalkboard, comic components, and `@scifunlab/solution-sdk`. Maintained upstream — do not edit in solution PRs.
- `AUTHORING.md`: Full specification for writing a solution file or building a new 2D/3D kit.

## Quick Start

```bash
npm install
npm run solutions:generate
npm run dev
```

Open `http://localhost:3000/solutions` to preview every textbook chapter, chalkboard step, 2D SVG poster, and interactive 2D/3D bench live.

## Before Opening a PR

```bash
npm run solutions:generate
npm run solutions:check
npm run typecheck
npm run lint
npm run build
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [AUTHORING.md](./AUTHORING.md) for content guidelines and attribution rules.

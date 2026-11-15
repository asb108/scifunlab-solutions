"use client";

import { useEffect, useState } from "react";

import { readStamps } from "@/lib/solutions/viewer/stamps";

/**
 * Stamps earned on a question, read from this browser after mount. Renders
 * nothing on the server and nothing until at least one stamp exists, so the
 * row's layout and the page's HTML stay the same for everyone.
 */
export function StampCount({ id, total }: { id: string; total: 2 | 3 }) {
  const [count, setCount] = useState(0);
  useEffect(() => setCount(readStamps(id).size), [id]);
  if (count === 0) return null;
  return (
    <span
      className="border-2 border-comic-ink bg-comic-yellow px-1.5 py-0.5 font-mono text-xs font-black text-comic-ink"
      aria-label={`${count} of ${total} stamps earned`}
    >
      ★ {count}/{total}
    </span>
  );
}

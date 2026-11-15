import "server-only";

export type BoardLineHtml = {
  html: string;
  say: string;
  color: "white" | "yellow" | "blue" | "green" | "pink";
  size: "sm" | "md" | "lg";
};

const COLORS = new Set(["white", "yellow", "blue", "green", "pink"]);
const SIZES = new Set(["sm", "md", "lg"]);

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatValue(name: string, values: Record<string, number>, decimals?: number): string {
  if (!(name in values)) {
    throw new Error(`Board line: unknown placeholder "{${name}}"`);
  }
  const n = values[name];
  return n.toFixed(decimals ?? 2);
}

function parsePlaceholder(body: string, start: number, values: Record<string, number>): { html: string; say: string; end: number } {
  let i = start + 1;
  let name = "";
  while (i < body.length && body[i] !== "}" && body[i] !== ":") {
    name += body[i];
    i++;
  }
  let decimals: number | undefined;
  if (body[i] === ":") {
    i++;
    let digits = "";
    while (i < body.length && body[i] !== "}") {
      digits += body[i];
      i++;
    }
    decimals = Number(digits);
    if (!Number.isFinite(decimals)) throw new Error(`Board line: invalid decimal count in "{${name}:${digits}}"`);
  }
  if (body[i] !== "}") throw new Error(`Board line: unclosed placeholder after "{${name}"`);
  i++;
  const text = formatValue(name, values, decimals);
  return { html: escapeHtml(text), say: text, end: i };
}

type MarkKind = "circle" | "box" | "underline";

function speakChar(ch: string): string {
  const map: Record<string, string> = {
    "θ": "theta",
    "α": "alpha",
    "×": " times ",
    "÷": " divided by ",
    "−": " minus ",
    "½": " half ",
    "⟹": " so ",
    "°": " degrees ",
  };
  return map[ch] ?? ch;
}

function speakText(text: string): string {
  return text
    .split("")
    .map(speakChar)
    .join("")
    .replace(/\^2/g, " squared")
    .replace(/_([a-zA-Z0-9]+)/g, " $1")
    .replace(/\s+/g, " ")
    .trim();
}

function renderInline(src: string, values: Record<string, number>, forSay: boolean): { html: string; say: string } {
  let html = "";
  let say = "";
  let i = 0;
  while (i < src.length) {
    if (src.startsWith("((", i)) {
      const close = src.indexOf("))", i + 2);
      if (close < 0) throw new Error(`Board line "<${src}>": unbalanced mark`);
      const inner = src.slice(i + 2, close);
      const pipe = inner.lastIndexOf("|");
      if (pipe < 0) throw new Error(`Board line "<${src}>": mark missing kind`);
      const text = inner.slice(0, pipe);
      const kind = inner.slice(pipe + 1) as MarkKind;
      if (!["circle", "box", "underline"].includes(kind)) {
        throw new Error(`Board line "<${src}>": unknown mark "${kind}"`);
      }
      const part = renderInline(text, values, forSay);
      html += `<span class="board-mark" data-mark="${kind}">${part.html}</span>`;
      say += part.say;
      i = close + 2;
      continue;
    }
    if (src.startsWith("[[", i)) {
      const close = src.indexOf("]]", i + 2);
      if (close < 0) throw new Error(`Board line "<${src}>": unbalanced scene link`);
      const inner = src.slice(i + 2, close);
      const pipe = inner.indexOf("|");
      if (pipe < 0) throw new Error(`Board line "<${src}>": scene link missing label`);
      const obj = inner.slice(0, pipe);
      const text = inner.slice(pipe + 1);
      const visible = renderInline(text, values, false).html;
      const spoken = speakText(text.replace(/\{[^}]+\}/g, (m) => {
        const p = parsePlaceholder(m, 0, values);
        return p.say;
      }));
      html += `<button type="button" class="scene-link" data-obj="${escapeHtml(obj)}" aria-label="${escapeHtml(`${spoken}, show in the 3D scene`)}">${visible}</button>`;
      say += spoken;
      i = close + 2;
      continue;
    }
    if (src[i] === "{") {
      const p = parsePlaceholder(src, i, values);
      html += p.html;
      say += p.say;
      i = p.end;
      continue;
    }
  const subMatch = src.slice(i).match(/^_\{([^}]+)\}/);
    if (subMatch) {
      html += `<sub>${escapeHtml(subMatch[1])}</sub>`;
      say += ` ${subMatch[1]}`;
      i += subMatch[0].length;
      continue;
    }
    const subSimple = src.slice(i).match(/^_([a-zA-Z0-9])/);
    if (subSimple) {
      html += `<sub>${escapeHtml(subSimple[1])}</sub>`;
      say += ` ${subSimple[1]}`;
      i += subSimple[0].length;
      continue;
    }
    const supBrace = src.slice(i).match(/^\^\{([^}]+)\}/);
    if (supBrace) {
      html += `<sup>${escapeHtml(supBrace[1])}</sup>`;
      say += supBrace[1] === "2" ? " squared" : ` ${supBrace[1]}`;
      i += supBrace[0].length;
      continue;
    }
    const supSimple = src.slice(i).match(/^\^([0-9])/);
    if (supSimple) {
      html += `<sup>${escapeHtml(supSimple[1])}</sup>`;
      say += supSimple[1] === "2" ? " squared" : ` ${supSimple[1]}`;
      i += supSimple[0].length;
      continue;
    }
    const ch = src[i];
    html += escapeHtml(ch);
    say += speakChar(ch);
    i++;
  }
  return { html, say };
}

export function renderBoardLine(src: string, values: Record<string, number>): BoardLineHtml {
  try {
    let rest = src.trim();
    let color: BoardLineHtml["color"] = "white";
    let size: BoardLineHtml["size"] = "md";

    for (;;) {
      const m = rest.match(/^(blue|green|pink|yellow|lg|sm):/);
      if (!m) break;
      const tag = m[1];
      if (COLORS.has(tag)) color = tag as BoardLineHtml["color"];
      else if (SIZES.has(tag)) size = tag as BoardLineHtml["size"];
      rest = rest.slice(m[0].length);
    }

    let tick = false;
    if (rest.endsWith("!tick")) {
      tick = true;
      rest = rest.slice(0, -5).trimEnd();
    }

    const body = renderInline(rest, values, false);
    const sayBody = renderInline(rest, values, true).say;
    const say = speakText(tick ? `${sayBody} correct` : sayBody);
    const tickHtml = tick ? '<span class="board-tick" aria-hidden="true"></span>' : "";

    return {
      html: body.html + tickHtml,
      say,
      color,
      size,
    };
  } catch (e) {
    const reason = e instanceof Error ? e.message.replace(/^Board line[^:]*:\s*/, "") : String(e);
    throw new Error(`Board line "${src}": ${reason}`);
  }
}

/** Plain visible text after substitution — for the 38-character check. */
export function boardLineText(src: string, values: Record<string, number>): string {
  const line = renderBoardLine(src, values);
  const plain = line.html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  return plain;
}

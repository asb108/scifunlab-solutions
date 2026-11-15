import "server-only";
import temml from "temml";

/**
 * Maths is rendered to MathML on the server. Browsers draw MathML natively, so
 * question pages ship no maths JavaScript, stylesheet or web fonts. A malformed
 * formula throws, which fails the build and names the formula.
 */
export function renderMath(tex: string, display = false): string {
  try {
    return temml.renderToString(tex, { displayMode: display, throwOnError: true });
  } catch (error) {
    throw new Error(`Could not render maths "${tex}": ${(error as Error).message}`);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain text with `$...$` inline and `$$...$$` display maths, as safe HTML. */
export function renderRich(body: string): string {
  // `[[name|text]]` -> a button that links the text to scene object `name`.
  const linked = body.split(/(\[\[[a-zA-Z0-9_]+\|[^\]]+\]\])/g);
  if (linked.length > 1) {
    return linked
      .map((part) => {
        const match = part.match(/^\[\[([a-zA-Z0-9_]+)\|([^\]]+)\]\]$/);
        if (!match) return renderPlain(part);
        const label = escapeHtml(`${speakable(match[2])}, show in the 3D scene`);
        return `<button type="button" class="scene-link" data-obj="${match[1]}" aria-label="${label}">${renderPlain(match[2])}</button>`;
      })
      .join("");
  }
  return renderPlain(body);
}

/**
 * A readable name for a link whose text may be only maths. Screen readers and
 * audits do not reliably take a button's name from MathML, so `$u_x$` becomes
 * "u x" and `$\\theta$` becomes "theta".
 */
function speakable(text: string): string {
  return text
    .replace(/\$/g, "")
    .replace(/\\(mathrm|text|vec|mathbf)\{([^}]*)\}/g, "$2")
    .replace(/\\([a-zA-Z]+)/g, "$1")
    .replace(/[_^{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderPlain(body: string): string {
  const parts = body.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
  return parts
    .map((part) => {
      if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
        return `<span class="math-display">${renderMath(part.slice(2, -2), true)}</span>`;
      }
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        return `<span class="math-inline">${renderMath(part.slice(1, -1))}</span>`;
      }
      return escapeHtml(part);
    })
    .join("");
}

import type { KitPosterProps } from "@scifunlab/solution-sdk/kit";
import type { ProjectileModel } from "./model";

const NIGHT = "#14183A";
const GRID = "#2A3070";
const PAPER = "#FAF9F6";
const VIOLET = "#5B50FF";
const GREEN = "#4ADE80";
const CORAL = "#FF5050";
const YELLOW = "#FFDE59";

/**
 * Server-rendered side view of the projectile scene for one step. It holds the
 * viewport before WebGL loads and is the step picture when WebGL is missing.
 */
export function ProjectilePoster({ model: rawModel, cue, t, width, height, describe }: KitPosterProps) {
  const m = rawModel as ProjectileModel;
  const show = new Set(cue.show);
  const xMax = Math.max(m.landing[0], 1);
  const yMax = Math.max(m.peakHeight, m.landing[1], m.h, 0.5);
  const spanX = xMax * 1.35;
  const spanY = Math.max(yMax * 1.5, spanX * (height / width) * 0.9);
  const px = (x: number) => ((x + xMax * 0.15) / spanX) * width;
  const py = (y: number) => height - ((y + spanY * 0.12) / spanY) * height;
  const toPoint = (x: number, y: number) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`;

  const end = Math.min(t, m.times.tFlight);
  const path = Array.from({ length: 41 }, (_, i) => m.at((end * i) / 40).p).map((p) => toPoint(p[0], p[1]));
  const ball = m.at(end).p;
  const slopeEnd = xMax * 1.2;
  const uLen = spanX * 0.22;
  const ox = 0;
  const oy = m.h;
  const tipU = [ox + uLen * Math.cos(m.theta), oy + uLen * Math.sin(m.theta)];
  const rel = m.theta - m.alpha;
  const onSlope = m.alpha !== 0;
  const ax = onSlope ? [Math.cos(m.alpha), Math.sin(m.alpha)] : [1, 0];
  const ay = onSlope ? [-Math.sin(m.alpha), Math.cos(m.alpha)] : [0, 1];
  const cx = uLen * Math.cos(onSlope ? rel : m.theta);
  const cy = uLen * Math.sin(onSlope ? rel : m.theta);

  const arrow = (x1: number, y1: number, x2: number, y2: number, color: string, key: string) => (
    <line
      key={key}
      x1={px(x1)}
      y1={py(y1)}
      x2={px(x2)}
      y2={py(y2)}
      stroke={color}
      strokeWidth={4}
      strokeLinecap="round"
      markerEnd={`url(#head-${color.slice(1)})`}
    />
  );

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={describe} className="block h-full w-full">
      <defs>
        <pattern id="poster-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill={GRID} />
        </pattern>
        {[VIOLET, GREEN, PAPER].map((color) => (
          <marker
            key={color}
            id={`head-${color.slice(1)}`}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={color} stroke="#000" strokeWidth="1" />
          </marker>
        ))}
      </defs>
      <rect width={width} height={height} fill={NIGHT} />
      <rect width={width} height={height} fill="url(#poster-dots)" />
      <line x1={0} y1={py(0)} x2={width} y2={py(0)} stroke={GRID} strokeWidth={3} />

      {onSlope ? (
        <polygon
          points={`${toPoint(-xMax * 0.1, -xMax * 0.1 * Math.tan(m.alpha))} ${toPoint(slopeEnd, slopeEnd * Math.tan(m.alpha))} ${toPoint(slopeEnd, 0)} ${toPoint(-xMax * 0.1, 0)}`}
          fill={PAPER}
          fillOpacity={show.has("slope") ? 0.9 : 0.35}
          stroke="#000"
          strokeWidth={3}
        />
      ) : null}
      {m.h > 0 ? (
        <rect x={px(-xMax * 0.08)} y={py(m.h)} width={px(0) - px(-xMax * 0.08)} height={py(0) - py(m.h)} fill={PAPER} stroke="#000" strokeWidth={3} />
      ) : null}

      {show.has("axes") ? (
        <g>
          {arrow(ox, oy, ox + spanX * 0.18 * ax[0], oy + spanX * 0.18 * ax[1], PAPER, "ax")}
          {arrow(ox, oy, ox + spanX * 0.15 * ay[0], oy + spanX * 0.15 * ay[1], PAPER, "ay")}
        </g>
      ) : null}
      {show.has("path") && end > 0 ? (
        <polyline points={path.join(" ")} fill="none" stroke={VIOLET} strokeWidth={4} strokeDasharray="10 6" />
      ) : null}
      {show.has("u") ? arrow(ox, oy, tipU[0], tipU[1], VIOLET, "u") : null}
      {show.has("ux") ? arrow(ox, oy, ox + cx * ax[0], oy + cx * ax[1], VIOLET, "ux") : null}
      {show.has("uy") ? arrow(ox, oy, ox + cy * ay[0], oy + cy * ay[1], VIOLET, "uy") : null}
      {show.has("g") ? arrow(ball[0], ball[1], ball[0], ball[1] - spanY * 0.18, GREEN, "g") : null}
      {show.has("landing") ? (
        <circle cx={px(m.landing[0])} cy={py(m.landing[1])} r={10} fill="none" stroke={CORAL} strokeWidth={4} />
      ) : null}
      {show.has("range") ? (
        <line
          x1={px(0 + ay[0] * spanX * 0.04)}
          y1={py(oy + ay[1] * spanX * 0.04 - (onSlope ? 0 : spanY * 0.05))}
          x2={px(m.landing[0] + ay[0] * spanX * 0.04)}
          y2={py(m.landing[1] + ay[1] * spanX * 0.04 - (onSlope ? 0 : spanY * 0.05))}
          stroke={YELLOW}
          strokeWidth={3}
        />
      ) : null}
      <circle cx={px(ball[0])} cy={py(ball[1]) - 9} r={9} fill={YELLOW} stroke="#000" strokeWidth={3} />
    </svg>
  );
}

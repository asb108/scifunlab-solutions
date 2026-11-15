import type { KitPosterProps, Vec3 } from "@scifunlab/solution-sdk/kit";

import { fieldArrowTip, traceFieldLine, type FieldModel } from "./model";

const NIGHT = "#14183A";
const GRID = "#2A3070";
const PAPER = "#FAF9F6";
const CORAL = "#FF5050";
const VIOLET = "#5B50FF";
const YELLOW = "#FFDE59";

export function FieldPoster({ model: rawModel, cue, t, width, height, describe }: KitPosterProps) {
  const model = rawModel as FieldModel;
  const show = new Set(cue.show);
  const id = `field-${cue.show.join("-")}-${t}-${width}-${height}`;
  const center = model.cameraPresets!.top!.target;
  const unit = Math.min(width / 12, height / 9);
  const px = (x: number) => width / 2 + (x - center[0]) * unit;
  const py = (y: number) => height / 2 - (y - center[1]) * unit;
  const point = (p: Vec3) => `${px(p[0]).toFixed(2)},${py(p[1]).toFixed(2)}`;
  const probe = model.toScene([model.probe[0], model.probe[1], 0]);
  const fieldLines = show.has("fieldLines") ? model.charges.filter((charge) => charge.q > 0).flatMap((charge) => {
    const origin = model.toScene([charge.x, 0, 0]);
    return Array.from({ length: 12 }, (_, i) => {
      const angle = i * Math.PI / 6;
      return traceFieldLine(model, [origin[0] + 0.4 * Math.cos(angle), 0.4 * Math.sin(angle), 0]);
    });
  }) : [];
  const testPosition = model.toScene(model.at(t).p);
  const testPath = show.has("testPath") ? model.testPath.filter((sample) => sample.t <= t).map(({ p }) => model.toScene(p)) : [];
  if (testPath.length && t > 0) testPath.push(testPosition);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={describe} className="block h-full w-full">
      <defs>
        <pattern id={`${id}-dots`} width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill={GRID} />
        </pattern>
        <marker id={`${id}-head`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill={YELLOW} stroke="black" strokeWidth="1" />
        </marker>
      </defs>
      <rect width={width} height={height} fill={NIGHT} />
      <rect width={width} height={height} fill={`url(#${id}-dots)`} />

      {fieldLines.map((line, i) => {
        const middle = Math.floor(line.length * 0.45);
        const a = line[Math.max(0, middle - 2)];
        const b = line[Math.min(line.length - 1, middle + 2)];
        return (
          <g key={i}>
            <polyline points={line.map(point).join(" ")} fill="none" stroke={YELLOW} strokeWidth={2} opacity={0.8} />
            {line.length > 4 ? <line x1={px(a[0])} y1={py(a[1])} x2={px(b[0])} y2={py(b[1])} stroke={YELLOW} strokeWidth={2} markerEnd={`url(#${id}-head)`} /> : null}
          </g>
        );
      })}

      {testPath.length > 1 ? <polyline points={testPath.map(point).join(" ")} fill="none" stroke={VIOLET} strokeWidth={3} strokeDasharray="8 5" /> : null}

      {show.has("charges") ? model.charges.map((charge, i) => {
        const p = model.toScene([charge.x, 0, 0]);
        const radius = 0.35 * unit;
        return (
          <g key={i}>
            <circle cx={px(p[0])} cy={py(p[1])} r={radius} fill={charge.q > 0 ? CORAL : charge.q < 0 ? VIOLET : PAPER} stroke="black" strokeWidth={3} />
            {charge.q !== 0 ? <line x1={px(p[0]) - radius * 0.4} y1={py(p[1])} x2={px(p[0]) + radius * 0.4} y2={py(p[1])} stroke={PAPER} strokeWidth={3} strokeLinecap="round" /> : null}
            {charge.q > 0 ? <line x1={px(p[0])} y1={py(p[1]) - radius * 0.4} x2={px(p[0])} y2={py(p[1]) + radius * 0.4} stroke={PAPER} strokeWidth={3} strokeLinecap="round" /> : null}
            <text x={px(p[0])} y={py(p[1] - 0.85)} fill={PAPER} textAnchor="middle" fontFamily="sans-serif" fontSize={16}>
              q<tspan baselineShift="sub" fontSize={11}>{i + 1}</tspan>
            </text>
          </g>
        );
      }) : null}

      {(["E1", "E2", "Enet"] as const).map((name) => {
        if (!show.has(name) || Math.hypot(...model.probeE[name]) === 0) return null;
        const tip = fieldArrowTip(probe, model.probeE[name], name === "Enet" ? 2.6 : 2);
        const strokeWidth = name === "Enet" ? 6 : 4;
        return (
          <g key={name}>
            <line x1={px(probe[0])} y1={py(probe[1])} x2={px(tip[0])} y2={py(tip[1])} stroke="black" strokeWidth={strokeWidth + 2} strokeLinecap="round" />
            <line x1={px(probe[0])} y1={py(probe[1])} x2={px(tip[0])} y2={py(tip[1])} stroke={YELLOW} strokeWidth={strokeWidth} strokeLinecap="round" markerEnd={`url(#${id}-head)`} />
            <text x={px(tip[0] + 0.3)} y={py(tip[1] + (name === "E2" ? -0.45 : 0.3))} fill={PAPER} fontFamily="sans-serif" fontSize={16}>
              E{name !== "Enet" ? <tspan baselineShift="sub" fontSize={11}>{name === "E1" ? 1 : 2}</tspan> : null}
            </text>
          </g>
        );
      })}

      {show.has("probe") ? (
        <g>
          <circle cx={px(probe[0])} cy={py(probe[1])} r={0.14 * unit} fill={PAPER} stroke="black" strokeWidth={3} />
          <text x={px(probe[0] - 0.4)} y={py(probe[1] + 0.3)} fill={PAPER} textAnchor="middle" fontFamily="sans-serif" fontSize={16}>P</text>
        </g>
      ) : null}

      {show.has("testCharge") && model.testCharge ? (
        <g>
          <circle cx={px(testPosition[0])} cy={py(testPosition[1])} r={0.18 * unit} fill={model.testCharge.q > 0 ? CORAL : model.testCharge.q < 0 ? VIOLET : PAPER} stroke="black" strokeWidth={3} />
          <text x={px(testPosition[0])} y={py(testPosition[1] + 0.5)} fill={PAPER} textAnchor="middle" fontFamily="sans-serif" fontSize={16}>
            q<tspan baselineShift="sub" fontSize={11}>0</tspan>
          </text>
        </g>
      ) : null}
    </svg>
  );
}

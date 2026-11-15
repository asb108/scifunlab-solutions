import { defineSolution } from "@scifunlab/solution-sdk";

export default defineSolution({
  citation: { book: "hc-verma", volume: 1, chapter: 3, section: "exercise", number: 45 },
  title: "Valid throw angles onto a floating boat",
  credits: [{ name: "SciFunLab Team", github: "asb108", role: "author" }],
  inShort:
    "A shore thrower launches at 10 m/s toward a 1.0 m boat centred 5.5 m away on level water; find which angle bands land inside.",
  topics: ["Projectile motion", "Horizontal range"],
  difficulty: 2,
  access: "free",
  kit: "projectile",

  given: {
    u: [10, "m/s"],
    theta: [72, "^\\circ", "\\theta"],
    alpha: [0, "^\\circ", "\\alpha"],
    h: [0, "m"],
    g: [9.8, "m/s^2"],
  },

  guess: { use: "landing", tolerance: 0.35 },
  whatIf: {
    tune: "theta",
    challenge: {
      kind: "target",
      of: "range",
      target: 5.1,
      tolerance: 0.15,
      label: "Dial up to hit near the boat's front rim (5.1 m)",
      why: "Raising theta from 72° to 75° brings the range in from 6.00 m to 5.10 m; low angles 15°–18° cover the same 5–6 m span.",
    },
  },

  steps: [
    {
      title: "Split the throw into components",
      board: [
        "boat spans 5.0 m to 6.0 m",
        "blue:[[ux|u_x]] = 10 cos 72° = {ux} m/s",
        "yellow:[[uy|u_y]] = 10 sin 72° = {uy} m/s",
      ],
      cue: { show: ["ground", "ball", "u", "ux", "uy"], highlight: ["ux", "uy"], at: 0, focus: "launch" },
      describe: "Velocity vectors show the rightward 3.09 m/s drift and steep 9.51 m/s upward launch component.",
    },
    {
      title: "Find how long it stays airborne",
      board: [
        "y = 0 again at T = 2 [[uy|u_y]] / g",
        "blue:T = 2 x {uy:3} / {gy} = {T} s",
      ],
      cue: { show: ["ground", "ball", "path", "uy", "g"], highlight: ["g"], at: "tPeak", focus: "peak" },
      describe: "Gravity decelerates the vertical velocity to zero at apex and brings the projectile back to water level in 1.94 s.",
    },
    {
      title: "Check reach at the 72° limit",
      board: [
        "[[range|R]] = [[ux|u_x]] T = {ux:3} x {T:3}",
        "green:= {range} m  (far boat rim)",
      ],
      cue: { show: ["ground", "ball", "path", "landing", "range"], highlight: ["range"], at: "tFlight", focus: "home" },
      describe: "At 72 degrees the full arc lands right at 6.00 m, touching the outer edge of the target boat.",
    },
    {
      title: "Read both valid angle bands",
      board: [
        "R = u^2 sin(2θ) / g in [5, 6]",
        "blue:θ in 15°-18° or 72°-75°",
        "green:lg:((72°-75° & 15°-18°|box)) !tick",
      ],
      cue: { show: ["ground", "ball", "path", "landing", "range"], highlight: ["landing", "range"], at: "tFlight", focus: "home" },
      describe: "The highlighted landing marker confirms complementary steep (72°–75°) and low (15°–18°) throws both score inside 5.0–6.0 m.",
    },
  ],

  answer: {
    value: 75,
    unit: "°",
    label: "Valid throw angle bands",
    tex: "15^\\circ\\text{ to }18^\\circ\\text{ or }72^\\circ\\text{ to }75^\\circ",
  },
});

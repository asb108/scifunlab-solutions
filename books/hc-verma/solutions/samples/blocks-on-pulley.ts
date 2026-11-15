import { defineSolution } from "@scifunlab/solution-sdk";

/**
 * Our own sample problem (not a book question). Check by hand:
 * D = m2 g - m1 g sin(alpha) = 29.4 - 9.8 = 19.6 N; f = mu m1 g cos(alpha) = 3.39 N
 * a = (19.6 - 3.39) / 5 = 3.24 m/s^2; T = m2 (g - a) = 19.68 N; dropIn1s = 1.62 m.
 * `kitParams.drop` just sets the bench's vertical ruler to 0-2.5 m (the
 * guess's own range), independent of this physics.
 */
export default defineSolution({
  citation: { book: "hc-verma", volume: 1, chapter: 6, section: "sample", number: 1 },
  title: "A block pulled up a rough slope",
  inShort: "A 2 kg block on a rough 30° slope is tied over a pulley to a hanging 3 kg block. How fast do they speed up?",
  given: {
    m1: [2, "kg", "m_1"],
    m2: [3, "kg", "m_2"],
    alpha: [30, "deg", "\\alpha"],
    mu: [0.2, "", "\\mu"],
    g: [9.8, "m/s^2"],
  },
  kitParams: { drop: 2.5 },
  topics: ["friction", "inclined-plane", "pulley", "blocks", "free-body-diagram"],
  difficulty: 2,
  access: "free",
  kit: "blocks",
  relatedLab: "/simulations/science/physics/pulley-systems",
  sample: true,
  guess: { use: "dropIn1s", tolerance: 0.2 },
  whatIf: {
    tune: "m2",
    challenge: { kind: "target", of: "a", target: 1.0, tolerance: 0.1, label: "Just right", why: "m_2 g now beats m_1 g sin α + f by just (m_1 + m_2) × 1 m/s², so a ≈ 1 m/s²." },
  },
  steps: [
    {
      title: "The setup",
      board: ["A sits on the slope; B hangs free", "A cord over a pulley links them"],
      describe: "A pale slope with a violet block on it. A string runs over a pulley at the top edge down to a coral block hanging in the air.",
      cue: { show: ["incline", "pulley", "string", "blockA", "blockB"], at: 0, focus: "home" },
    },
    {
      title: "Forces on block A",
      board: ["N = m_1 g cos α = (({N:2} N|circle))", "f = μN = (({f:2} N|circle)) down the slope"],
      describe: "Only block A is bright. Coral arrows show the normal force, friction down the slope, and gravity.",
      cue: { show: ["incline", "blockA", "N", "fA", "gA", "T_A", "fbdA"], highlight: ["fA"], at: 0, focus: "blockA" },
    },
    {
      title: "Forces on block B",
      board: ["T pulls up; m_2 g pulls down", "Net pull wins ⟹ B falls, A rises"],
      describe: "Only block B is bright, with tension pointing up and its weight pointing down.",
      cue: { show: ["blockB", "string", "T_B", "gB", "fbdB"], at: 0, focus: "pulley" },
    },
    {
      title: "Solve for the acceleration",
      board: ["Newton's 2nd law on each block:", "green:lg:a = (({a:2} m/s^2|box)) !tick"],
      describe: "Both blocks are shown with a green acceleration arrow: up the slope for A, down for B.",
      cue: { show: ["incline", "pulley", "string", "blockA", "blockB", "a"], highlight: ["a"], at: 0, focus: "home" },
    },
    {
      title: "Let go",
      board: ["T = m_2(g − a) = (({T:2} N|circle))", "So B falls (({dropIn1s:2} m|circle)) in 1 s"],
      describe: "Block B drops and block A slides up the slope as the pulley turns.",
      cue: { show: ["incline", "pulley", "string", "blockA", "blockB", "a"], at: "tEnd", focus: "home" },
    },
  ],
  answer: { value: 3.24, unit: "m/s^2", label: "Acceleration of the blocks" },
});

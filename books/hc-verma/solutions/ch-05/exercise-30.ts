import { defineSolution } from "@scifunlab/solution-sdk";

export default defineSolution({
  citation: { book: "hc-verma", volume: 1, chapter: 5, section: "exercise", number: 30 },
  title: "String tension for coupled blocks on a smooth table",
  credits: [{ name: "SciFunLab Team", github: "asb108", role: "author" }],
  inShort:
    "Two 1.0 kg blocks share a light cord over a frictionless edge pulley; find cord tension after release with g = 10 m/s^2.",
  topics: ["Connected motion", "Free-body diagrams"],
  difficulty: 1,
  access: "free",
  kit: "blocks",
  kitParams: { drop: 2.5 },

  given: {
    m1: [1, "kg", "m_1"],
    m2: [1, "kg", "m_2"],
    alpha: [0, "^\\circ", "\\alpha"],
    mu: [0, "", "\\mu"],
    g: [10, "m/s^2"],
  },

  guess: { use: "dropIn1s", tolerance: 0.25 },
  whatIf: {
    tune: "m2",
    challenge: {
      kind: "target",
      of: "T",
      target: 3.75,
      tolerance: 0.15,
      label: "Adjust the hanging mass so cord tension drops to 3.75 N",
      why: "Reducing m_2 from 1.00 kg to 0.60 kg slows acceleration to 3.75 m/s^2, so T = m_1 a equals 3.75 N.",
    },
  },

  steps: [
    {
      title: "Analyze the block on the table",
      board: [
        "smooth horizontal table (μ = 0)",
        "yellow:[[N|N]] = m_1 g = {N} N",
        "blue:[[T_A|T]] = m_1 [[a|a]]  (table block)",
      ],
      cue: {
        show: ["incline", "pulley", "string", "blockA", "blockB", "N", "gA", "T_A"],
        highlight: ["T_A", "blockA"],
        at: 0,
        focus: "blockA",
      },
      describe: "On the frictionless horizontal table, only cord tension accelerates block A horizontally while N balances gravity.",
    },
    {
      title: "Analyze the hanging block",
      board: [
        "hanging mass m_2 = 1.0 kg",
        "blue:m_2 g - [[T_B|T]] = m_2 [[a|a]]",
      ],
      cue: {
        show: ["incline", "pulley", "string", "blockA", "blockB", "T_B", "gB"],
        highlight: ["T_B", "gB", "blockB"],
        at: 0,
        focus: "pulley",
      },
      describe: "Gravity pulls hanging block B downward while upward cord tension resists it.",
    },
    {
      title: "Combine equations for acceleration",
      board: [
        "m_2 g = (m_1 + m_2) a",
        "yellow:10 = 2 a  =>  [[a|a]] = {a} m/s^2",
        "blue:1 s drop = 0.5 a = {dropIn1s} m",
      ],
      cue: { show: ["incline", "pulley", "string", "blockA", "blockB", "a"], highlight: ["a"], at: "tEnd", focus: "home" },
      describe: "Adding both free-body equations cancels internal tension and reveals a 5.00 m/s^2 system acceleration.",
    },
    {
      title: "Evaluate tension in the cord",
      board: [
        "T = m_1 a = 1.0 x {a} N",
        "green:lg:((T = {T} N|box)) !tick",
      ],
      cue: { show: ["incline", "pulley", "string", "blockA", "blockB", "T_A", "T_B"], highlight: ["T_A", "T_B"], at: "tEnd", focus: "pulley" },
      describe: "Tension arrows on both blocks confirm the light cord transmits 5.00 N.",
    },
  ],

  answer: {
    value: 5,
    unit: "N",
    label: "Tension in the cord",
  },
});

import { defineSolution } from "@scifunlab/solution-sdk";

/**
 * Our own sample problem (not a book question), used to build and check the
 * lab bench. Check: R = 2u^2 sin(theta - alpha) cos(theta) / (g cos^2 alpha)
 * = 2(100)(0.5)(0.7071) / (9.8 x 0.9330) = 7.73 m, T = 1.056 s.
 * Board wording ported from the approved prototype at
 * `app/solutions/prototype-bench` (commit 416fc0d).
 */
export default defineSolution({
  citation: { book: "hc-verma", volume: 1, chapter: 3, section: "sample", number: 1 },
  title: "A ball thrown up a slope",
  inShort: "A ball is thrown from the foot of a 15° slope at 45° to the ground. How far up the slope does it land?",
  given: {
    u: [10, "m/s"],
    theta: [45, "deg", "\\theta"],
    alpha: [15, "deg", "\\alpha"],
    g: [9.8, "m/s^2"],
  },
  topics: ["projectile", "inclined-plane"],
  difficulty: 2,
  access: "free",
  kit: "projectile",
  relatedLab: "/simulations/science/physics/projectile-motion",
  sample: true,
  guess: { use: "landing", tolerance: 0.5 },
  whatIf: {
    tune: "theta",
    challenge: { kind: "max", of: "range", label: "Best angle", why: "45° + α/2 splits the gap between the slope and straight up." },
  },
  steps: [
    {
      title: "Tilt your axes",
      board: [
        "x along the slope, y out of it",
        "yellow:lands on the slope ⟹ ((y = 0 again|underline))",
        "green:sm:slope angle α = {alpha:0}° (protractor)",
      ],
      describe: "A dark lab floor with a pale slope rising to the right. Two white axes start at the ball: x along the slope, y at right angles to it.",
      cue: { show: ["slope", "axes", "ball"], at: 0, focus: "home" },
    },
    {
      title: "Split the launch speed",
      board: [
        "angle with slope = {theta:0}° − {alpha:0}° = {phi:0}°",
        "blue:u_x = u cos {phi:0}° = (({ux} m/s|circle))",
        "blue:u_y = u sin {phi:0}° = (({uy} m/s|circle))",
      ],
      describe: "A violet arrow u points up at 45 degrees. Two lighter arrows split it into a part along the slope and a part at right angles to it.",
      cue: { show: ["slope", "axes", "ball", "u", "ux", "uy"], highlight: ["ux", "uy"], at: 0, focus: "launch" },
    },
    {
      title: "Split gravity too",
      board: [
        "Tilted axes ⟹ gravity has two parts:",
        "green:along: g sin {alpha:0}° = (({gx}|circle)) (back down)",
        "green:across: g cos {alpha:0}° = (({gy}|circle)) (into slope)",
      ],
      describe: "A green arrow g points straight down from the ball, split into a part along the slope and a part into it.",
      cue: { show: ["slope", "axes", "ball", "u", "g"], highlight: ["g"], at: 0, focus: "peak" },
    },
    {
      title: "How long is it in the air?",
      predict: {
        question: "Before it flies: how far up the slope will the ball land?",
        options: ["About 4 m", "About 8 m", "About 12 m"],
        answer: 1,
        reveal: "It lands 7.73 m up the slope. Watch it fly, then check the working below.",
      },
      board: ["Across the slope, it's up-and-down:", "pink:u_y t − ½ g cos α t^2 = 0", "pink:lg:t = 2u_y ÷ (g cos α) = (({T} s|circle))"],
      describe: "The ball flies along a dashed violet curve and comes down on the slope about one second later.",
      cue: { show: ["slope", "ball", "path", "g"], at: "tFlight", focus: "home" },
    },
    {
      title: "How far up the slope?",
      board: [
        "s = u_x t − ½ g sin α t^2",
        "blue:sm:= {ux} × {T} − ½ × {gx} × {T}^2",
        "yellow:lg:= {uxT:3} − {drag:3} = (({range} m|box)) !tick",
      ],
      describe: "A coral ring marks the landing point, and a yellow measuring line along the slope shows 7.73 metres.",
      cue: { show: ["slope", "ball", "path", "landing", "range"], highlight: ["range"], at: "tFlight", focus: "home" },
    },
  ],
  answer: { value: 7.73, unit: "m", label: "Distance up the slope" },
});

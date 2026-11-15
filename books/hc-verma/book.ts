import { defineBook } from "@scifunlab/solution-sdk";
import { hcVermaChapters } from "./map";

export const hcVermaBook = defineBook({
  id: "hc-verma",
  title: "HC Verma",
  subtitle: "Concepts of Physics",
  badge: "Vols 1 and 2",
  summary: "All 47 chapters mapped. Solutions open chapter by chapter, starting with the easier questions.",
  heroLabel: "HC Verma · Concepts of Physics",
  heroHeading: "HC Verma, solved in 3D!",
  heroDescription:
    "Pick a chapter, search a question number like 3.12, or launch an interactive 3D problem right away.",
  hubTitle: "HC Verma solutions in 3D",
  hubDescription:
    "Browse all 47 chapters of HC Verma's Concepts of Physics and open step-by-step solutions you can rotate and replay in 3D.",
  chapterTitlePrefix: "HC Verma",
  questionTitlePrefix: "HC Verma",
  breadcrumbLabel: "HC Verma",
  chapters: hcVermaChapters,
});

export default hcVermaBook;

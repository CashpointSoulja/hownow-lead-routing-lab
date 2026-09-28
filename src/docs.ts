import readme from "../README.md";
import prd from "../docs/PRD.md";
import fiveWhys from "../docs/FIVE_WHYS.md";
import taxonomy from "../docs/EVENT_TAXONOMY.md";
import experiment from "../docs/EXPERIMENT_DESIGN.md";
import validation from "../docs/VALIDATION_PLAN.md";
import decisionMakers from "../docs/DECISION_MAKERS.md";

export interface Doc {
  slug: string;
  title: string;
  markdown: string;
}

export const DOCS: Doc[] = [
  { slug: "readme", title: "README", markdown: readme },
  { slug: "prd", title: "PRD", markdown: prd },
  { slug: "five-whys", title: "Five whys", markdown: fiveWhys },
  { slug: "event-taxonomy", title: "Event taxonomy", markdown: taxonomy },
  { slug: "experiment-design", title: "Experiment design", markdown: experiment },
  { slug: "validation-plan", title: "Validation plan", markdown: validation },
  { slug: "decision-makers", title: "Decision makers", markdown: decisionMakers },
];

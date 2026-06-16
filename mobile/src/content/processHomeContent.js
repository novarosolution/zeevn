/**
 * Bilona process journey — admin API shape + bundled image fallbacks.
 * Edit defaults in Admin → Home View → Process journey.
 */

export const PROCESS_STEP_IMAGE_FALLBACKS = {};

const DEFAULT_STEPS = [
  {
    id: "process-01",
    order: 0,
    enabled: true,
    title: "Grass-fed Kankrej cows graze freely",
    description: "Indigenous desi cows roam open pastures — never force-fed, never rushed.",
    imageUrl: "",
    imageFit: "contain",
    imagePosition: "center",
  },
  {
    id: "process-02",
    order: 1,
    enabled: true,
    title: "Fresh A2 milk collected daily",
    description: "Morning milk from healthy Kankrej cows, rich in A2 beta-casein protein.",
    imageUrl: "",
    imageFit: "contain",
    imagePosition: "center",
  },
  {
    id: "process-03",
    order: 2,
    enabled: true,
    title: "Curd set overnight with natural culture",
    description: "Traditional culture at room temperature — the foundation of true Bilona ghee.",
    imageUrl: "",
    imageFit: "contain",
    imagePosition: "center",
  },
  {
    id: "process-04",
    order: 3,
    enabled: true,
    title: "Hand-churned Bilona into white butter",
    description: "Makhan separated by hand from curd — not industrial cream.",
    imageUrl: "",
    imageFit: "contain",
    imagePosition: "center",
  },
  {
    id: "process-05",
    order: 4,
    enabled: true,
    title: "Slow-cooked on a wood fire",
    description: "Patient wood-fired simmer until water evaporates and aroma deepens.",
    imageUrl: "",
    imageFit: "contain",
    imagePosition: "center",
  },
  {
    id: "process-06",
    order: 5,
    enabled: true,
    title: "Golden ghee, glass-bottled",
    description: "Grainy, aromatic A2 ghee — sealed in glass for freshness and purity.",
    imageUrl: "",
    imageFit: "contain",
    imagePosition: "center",
  },
];

/** Admin `/home-view` + display defaults. */
export function buildProcessSectionDefaults() {
  return {
    enabled: true,
    eyebrow: "How it's made",
    title: "Six steps from pasture to jar",
    subtitle: "No shortcuts. No cream separation. Only curd-churned Bilona ghee.",
    journeyLabel: "The Bilona journey",
    filmLabel: "Chapter I",
    openingLine: "From open pasture to golden jar — every step by hand.",
    steps: DEFAULT_STEPS.map((step) => ({ ...step })),
  };
}

export function getProcessStepImageFallback(stepId) {
  return PROCESS_STEP_IMAGE_FALLBACKS[stepId] || null;
}

/** Legacy export for `gheeHomeContent.js`. */
export const PROCESS_HOME_CONTENT = {
  eyebrow: "How it's made",
  title: "Six steps from pasture to jar",
  subtitle: "No shortcuts. No cream separation. Only curd-churned Bilona ghee.",
  journeyLabel: "The Bilona journey",
  filmLabel: "Chapter I",
  openingLine: "From open pasture to golden jar — every step by hand.",
  steps: DEFAULT_STEPS.map((step, index) => ({
    step: index + 1,
    title: step.title,
    description: step.description,
    image: getProcessStepImageFallback(step.id),
    imageFit: step.imageFit,
    imagePosition: step.imagePosition,
  })),
};

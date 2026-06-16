import { COMPARE_HOME_CONTENT } from "./compareHomeContent";
import { PROCESS_HOME_CONTENT } from "./processHomeContent";

/**
 * Premium A2 Kankrej ghee home sections — single source for web home story blocks.
 * Re-exported as `HOME_STORY_CONTENT` from `appContent.js`.
 *
 * Also edit in Admin → Home View: about eyebrow, title, body, video, photos.
 * Process steps are edited in Admin → Home View → Process journey.
 * Compare section (“Ours vs ordinary”) is managed in Admin → Home View → Compare ghee.
 * Static labels (pull quote, gallery eyebrow) live in `HOME_SCREEN_UI.ourStory`.
 */
export const GHEE_HOME_CONTENT = {
  process: PROCESS_HOME_CONTENT,

  differentiators: COMPARE_HOME_CONTENT,

  whyKankrej: {
    eyebrow: "Why Kankrej",
    title: "The breed behind the gold",
    subtitle:
      "Kankrej cattle are an indigenous treasure of Gujarat and Rajasthan — hardy, heat-tolerant, and prized for nourishing A2 milk.",
    body:
      "For centuries, Kankrej cows have thrived in western India. Their A2 beta-casein milk is easier to digest and holds a revered place in Ayurvedic nutrition. We partner with small herds raised naturally — every jar honours the animal, the land, and the slow craft of Bilona ghee.",
    stats: [
      { value: "A2 Protein", label: "Easier to digest", description: "Beta-casein A2 — not the A1 found in most commercial dairy." },
      { value: "Indigenous Desi", label: "Kankrej heritage", description: "One of India's oldest and hardiest cattle breeds." },
      { value: "Ayurvedic", label: "Time-honoured wellness", description: "Prized for cooking, rituals, and daily nourishment." },
    ],
  },

  benefits: {
    eyebrow: "Benefits",
    title: "Why families choose our ghee",
    items: [
      { title: "Aids digestion", description: "Butyric acid and traditional preparation support gut health." },
      { title: "A2 protein goodness", description: "From indigenous Kankrej cows — gentler for many constitutions." },
      { title: "Fat-soluble vitamins", description: "Rich in vitamins A, D, E, and K naturally present in pure ghee." },
      { title: "Supports immunity", description: "Nourishing fats and antioxidants from slow wood-fired cooking." },
      { title: "Ayurvedic cooking", description: "Ideal for tadka, sweets, and daily wellness rituals." },
      { title: "Deep, nutty aroma", description: "Grainy texture and wood-fire character you can taste." },
    ],
  },

  testimonials: {
    eyebrow: "Testimonials",
    title: "Loved across Gujarat",
    items: [
      {
        quote: "The grain and aroma remind me of my grandmother's kitchen. We use nothing else for our dal tadka now.",
        name: "Priya Shah",
        location: "Ahmedabad, Gujarat",
      },
      {
        quote: "Finally ghee I trust for my children — pure A2, no odd aftertaste. The glass bottle feels as premium as the ghee.",
        name: "Ramesh Patel",
        location: "Rajkot, Gujarat",
      },
      {
        quote: "I switched from supermarket brands after tasting Zeevan. You can tell it's Bilona — rich, golden, and honest.",
        name: "Meera Desai",
        location: "Surat, Gujarat",
      },
    ],
  },
};

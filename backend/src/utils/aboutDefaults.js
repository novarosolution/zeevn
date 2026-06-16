/** About page sidebar / mission / craft defaults (merged in normalizeAboutSection). */
function buildAboutPageExtrasDefaults() {
  return {
    pageLead:
      "Hand-churned Bilona ghee from indigenous Kankrej cows — slow, honest, and golden.",
    pullQuote: "Nothing rushed.\nNothing added.\nOnly pure Bilona craft.",
    bodyContinued:
      "For centuries, Kankrej cows have thrived in western India. Their A2 beta-casein milk is easier to digest and holds a revered place in Ayurvedic nutrition. We partner with small herds raised naturally — every jar honours the animal, the land, and the slow craft of Bilona ghee.",
    heritage: {
      eyebrow: "Why Kankrej",
      title: "The breed behind the gold",
      body:
        "Kankrej cattle are an indigenous treasure of Gujarat and Rajasthan — hardy, heat-tolerant, and prized for nourishing A2 milk. For generations, these desi cows have grazed open pasture under the western sun. Their milk carries the beta-casein A2 protein that many families find gentler and more nourishing than ordinary dairy.",
    },
    bilona: {
      eyebrow: "Bilona craft",
      title: "Hand-churned, never hurried",
      body:
        "True Bilona ghee begins with curd, not cream. Fresh A2 milk is cultured, then churned by hand until butter rises — the way grandmothers did for centuries. That butter is slow-clarified over wood fire in small batches until the water leaves and only golden, grainy ghee remains. No industrial separators. No shortcuts.",
    },
    origin: {
      eyebrow: "Our roots",
      title: "Born in Gujarat, made for Indian kitchens",
      body:
        "Zeevan started with one conviction: families deserve ghee that tastes like memory — nutty, golden, and honest. We work with pastoral communities who raise Kankrej cows with care, pay fair prices, and bottle in small runs so freshness never waits on a warehouse shelf.",
    },
    values: [
      {
        title: "Purity first",
        body: "Lab-tested batches, glass bottles, and zero adulteration — what you read on the label is what you pour.",
      },
      {
        title: "Slow by design",
        body: "Wood-fired simmering and hand churning cannot be rushed. Patience is part of the recipe.",
      },
      {
        title: "Fair to farmers",
        body: "We source directly from herds we know, ensuring pastoral families earn a fair share of every jar sold.",
      },
      {
        title: "Transparent always",
        body: "Live order tracking, clear product pages, and support that answers like a neighbour would.",
      },
    ],
    highlights: [
      {
        value: "A2 Protein",
        label: "Easier to digest",
        description: "Beta-casein A2 — not the A1 found in most commercial dairy.",
      },
      {
        value: "Indigenous Desi",
        label: "Kankrej heritage",
        description: "One of India's oldest and hardiest cattle breeds.",
      },
      {
        value: "Ayurvedic",
        label: "Time-honoured wellness",
        description: "Prized for cooking, rituals, and daily nourishment.",
      },
    ],
    sidebarStats: [
      { value: "12.5k+", label: "Orders fulfilled" },
      { value: "4.9★", label: "Average rating" },
      { value: "100%", label: "Pure A2 ghee" },
      { value: "40+", label: "Cities served" },
    ],
    mission: {
      eyebrow: "Mission",
      title: "Good food should feel unmistakably real",
      paragraphs: [
        "We work with small-batch partners who share our obsession with clarity, aroma, and honest labels. No shortcuts — just ingredients you would proudly serve at your own table.",
        "Every order earns rewards, every delivery is tracked in real time, and every product page tells you exactly what you are buying. Transparency is part of the craft.",
      ],
    },
    pillars: [
      {
        id: "source",
        icon: "leaf-outline",
        title: "Thoughtful sourcing",
        body: "Grass-fed A2 milk, cold-pressed oils, and pantry staples chosen for purity — not shelf appeal.",
        enabled: true,
      },
      {
        id: "craft",
        icon: "flame-outline",
        title: "Slow craft",
        body: "Traditional methods, small batches, and patient churning for the golden clarity ghee is known for.",
        enabled: true,
      },
      {
        id: "fair",
        icon: "heart-outline",
        title: "Fair pricing",
        body: "Premium quality without the premium markup. Rewards on every order keep loyal kitchens saving.",
        enabled: true,
      },
      {
        id: "deliver",
        icon: "bicycle-outline",
        title: "Delivered with care",
        body: "Live order tracking, secure checkout, and support that answers like a neighbour would.",
        enabled: true,
      },
    ],
    craft: {
      eyebrow: "The process",
      title: "From farm to your morning roti",
      steps: [
        {
          id: "milk",
          label: "01",
          title: "Select milk",
          body: "A2 milk from grass-fed herds, tested for quality before it ever reaches the churn.",
        },
        {
          id: "churn",
          label: "02",
          title: "Slow churn",
          body: "Patient, low-heat churning until the butter separates — the step that builds aroma.",
        },
        {
          id: "clarify",
          label: "03",
          title: "Clarify & rest",
          body: "Ghee is clarified, filtered, and rested so the golden colour and nutty notes settle in.",
        },
        {
          id: "pack",
          label: "04",
          title: "Pack & ship",
          body: "Sealed fresh, shipped with live tracking — from our kitchen partners to yours.",
        },
      ],
    },
    ctaBand: {
      title: "Ready to taste the difference?",
      body: "Explore bestsellers, earn rewards on your first order, and track delivery every step of the way.",
      ctaLabel: "Browse the shop",
      ctaSecondaryLabel: "Contact support",
    },
  };
}

module.exports = { buildAboutPageExtrasDefaults };

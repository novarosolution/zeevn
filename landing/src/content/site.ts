export type NavLink = { label: string; href: string };

export type ProcessStep = {
  step: number;
  title: string;
  description: string;
  icon: string;
};

export type Differentiator = {
  title: string;
  ours: string;
  ordinary: string;
};

export type StatCard = {
  value: string;
  label: string;
  description: string;
};

export type Benefit = {
  title: string;
  description: string;
  icon: string;
};

export type Testimonial = {
  quote: string;
  name: string;
  location: string;
};

export type Product = {
  id: string;
  size: string;
  price: string;
  priceNote?: string;
  badge?: string;
  image: string;
};

export type FAQ = {
  question: string;
  answer: string;
};

export type VideoConfig = {
  title: string;
  caption: string;
  poster: string;
  /** YouTube embed URL or direct mp4 path */
  src: string;
  type: "youtube" | "mp4";
};

export const site = {
  brand: {
    name: "Zeevan",
    tagline: "Pure heritage, delivered fresh — hand-churned A2 ghee from Gujarat.",
    phone: process.env.NEXT_PUBLIC_BRAND_PHONE || "",
    whatsapp: process.env.NEXT_PUBLIC_BRAND_WHATSAPP || "",
    email: process.env.NEXT_PUBLIC_BRAND_EMAIL || "support@zeevan.app",
    address: "Kutch, Gujarat, India",
    social: {
      instagram: "https://instagram.com/zeevan",
      facebook: "https://facebook.com/zeevan",
      youtube: "https://youtube.com/@zeevan",
    },
  },

  nav: {
    links: [
      { label: "Story", href: "#story" },
      { label: "How It's Made", href: "#process" },
      { label: "Why Kankrej", href: "#why-kankrej" },
      { label: "Benefits", href: "#benefits" },
      { label: "Buy", href: "#order" },
    ] as NavLink[],
    cta: "Order Now",
  },

  hero: {
    eyebrow: "Artisanal · A2 · Bilona",
    headline: "Zeevan — Pure A2 Kankrej Cow Ghee",
    subline:
      "Hand-churned from curd, slow-cooked on a wood fire — the ancestral Bilona method, bottled in small batches for your table.",
    primaryCta: { label: "Order Now", href: "#order" },
    secondaryCta: { label: "See the process", href: "#process" },
    image: "/images/hero-ghee.jpg",
    imageAlt: "Glass jar of golden Zeevan A2 ghee",
    badges: ["100% Pure", "A2 Desi", "No Preservatives"],
  },

  video: {
    title: "How our ghee is made",
    caption: "From grass-fed Kankrej cows to golden, grainy ghee — every step honoured by hand.",
    poster: "/images/video-poster.jpg",
    src: process.env.NEXT_PUBLIC_PROMO_VIDEO_URL || "",
    type: "mp4",
  } satisfies VideoConfig,

  process: {
    id: "process",
    eyebrow: "How it's made",
    title: "Six steps from pasture to jar",
    subtitle: "No shortcuts. No cream separation. Only curd-churned Bilona ghee.",
    steps: [
      {
        step: 1,
        title: "Grass-fed Kankrej cows graze freely",
        description: "Indigenous desi cows roam open pastures — never force-fed, never rushed.",
        icon: "cow",
      },
      {
        step: 2,
        title: "Fresh A2 milk collected daily",
        description: "Morning milk from healthy Kankrej cows, rich in A2 beta-casein protein.",
        icon: "milk",
      },
      {
        step: 3,
        title: "Curd set overnight with natural culture",
        description: "Traditional culture at room temperature — the foundation of true Bilona ghee.",
        icon: "culture",
      },
      {
        step: 4,
        title: "Hand-churned Bilona into white butter",
        description: "Makhan separated by hand from curd — not industrial cream.",
        icon: "churn",
      },
      {
        step: 5,
        title: "Slow-cooked on a wood fire",
        description: "Patient wood-fired simmer until water evaporates and aroma deepens.",
        icon: "fire",
      },
      {
        step: 6,
        title: "Golden ghee, glass-bottled",
        description: "Grainy, aromatic A2 ghee — sealed in glass for freshness and purity.",
        icon: "jar",
      },
    ] as ProcessStep[],
  },

  differentiators: {
    id: "differentiators",
    eyebrow: "What makes us different",
    title: "Ours vs ordinary ghee",
    subtitle: "Most shelves sell factory-processed fat. We sell heritage.",
    items: [
      {
        title: "Milk source",
        ours: "A2 milk from indigenous Kankrej cows",
        ordinary: "A1 milk from crossbred or HF cows",
      },
      {
        title: "Method",
        ours: "Traditional Bilona curd-churned ghee",
        ordinary: "Factory cream separation or direct ghee",
      },
      {
        title: "Feed & ethics",
        ours: "Grass-fed, free-grazing, ethically raised",
        ordinary: "Confined or grain-heavy commercial farming",
      },
      {
        title: "Cooking",
        ours: "Wood-fired slow cooking for aroma & grain",
        ordinary: "High-heat industrial processing",
      },
      {
        title: "Purity",
        ours: "Zero preservatives, additives, or adulteration",
        ordinary: "Often blended, flavoured, or stabilised",
      },
      {
        title: "Packaging",
        ours: "Small-batch, glass-bottled freshness",
        ordinary: "Mass-produced plastic or tin packaging",
      },
    ] as Differentiator[],
  },

  whyKankrej: {
    id: "why-kankrej",
    eyebrow: "Why Kankrej",
    title: "The breed behind the gold",
    subtitle:
      "Kankrej cattle are an indigenous treasure of Gujarat and Rajasthan — hardy, heat-tolerant, and prized for their nourishing A2 milk.",
    body: [
      "For centuries, Kankrej cows have thrived in the arid landscapes of western India. Their A2 beta-casein milk is easier to digest and holds a revered place in Ayurvedic nutrition.",
      "We partner with small herds raised naturally — no hormones, no rush. Every jar honours the animal, the land, and the slow craft of Bilona ghee.",
    ],
    image: "/images/kankrej-cows.jpg",
    imageAlt: "Kankrej cows grazing at golden hour",
    stats: [
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
        description: "Prized in Ayurveda for cooking, rituals, and daily nourishment.",
      },
    ] as StatCard[],
  },

  benefits: {
    id: "benefits",
    eyebrow: "Benefits",
    title: "Why families choose our ghee",
    items: [
      {
        title: "Aids digestion",
        description: "Butyric acid and traditional preparation support gut health.",
        icon: "digest",
      },
      {
        title: "A2 protein goodness",
        description: "From indigenous Kankrej cows — gentler for many constitutions.",
        icon: "protein",
      },
      {
        title: "Fat-soluble vitamins",
        description: "Rich in vitamins A, D, E, and K naturally present in pure ghee.",
        icon: "vitamins",
      },
      {
        title: "Supports immunity",
        description: "Nourishing fats and antioxidants from slow wood-fired cooking.",
        icon: "shield",
      },
      {
        title: "Ayurvedic cooking",
        description: "Ideal for tadka, sweets, and daily wellness rituals.",
        icon: "flame",
      },
      {
        title: "Deep, nutty aroma",
        description: "Grainy texture and wood-fire character you can taste.",
        icon: "aroma",
      },
    ] as Benefit[],
  },

  testimonials: {
    id: "testimonials",
    eyebrow: "Testimonials",
    title: "Loved by our customers",
    items: [] as Testimonial[],
  },

  products: {
    id: "order",
    eyebrow: "Order",
    title: "Choose your jar",
    subtitle: "Small-batch glass bottles — shipped with care across India.",
    whatsappCta: "Order on WhatsApp",
    buyCta: "Buy Now",
    items: [
      {
        id: "ghee-250",
        size: "250 ml",
        price: "₹649",
        priceNote: "Trial size",
        image: "/images/ghee-250.jpg",
      },
      {
        id: "ghee-500",
        size: "500 ml",
        price: "₹1,199",
        badge: "Most popular",
        image: "/images/ghee-500.jpg",
      },
      {
        id: "ghee-1l",
        size: "1 L",
        price: "₹2,199",
        priceNote: "Family pack",
        image: "/images/ghee-1l.jpg",
      },
    ] as Product[],
  },

  faqs: {
    id: "faq",
    eyebrow: "FAQ",
    title: "Questions we hear often",
    items: [
      {
        question: "Is this truly A2 ghee?",
        answer:
          "Yes. Our ghee is made exclusively from A2 milk of indigenous Kankrej cows — not crossbred or HF cattle.",
      },
      {
        question: "What is the Bilona method?",
        answer:
          "Bilona ghee is made by culturing milk into curd, hand-churning it into butter (makhan), then slow-cooking that butter on a wood fire — never from separated cream.",
      },
      {
        question: "What is the shelf life?",
        answer:
          "Stored in a cool, dry place away from direct sunlight, our ghee stays fresh for up to 12 months. Refrigeration is optional after opening.",
      },
      {
        question: "Do you ship across India?",
        answer:
          "Yes. We pack in protective glass packaging and ship pan-India via trusted couriers. Delivery timelines are shared on WhatsApp at order time.",
      },
      {
        question: "How do you prove purity?",
        answer:
          "We batch-test for adulteration, maintain full traceability from farm to jar, and welcome lab reports on request. Zero preservatives, always.",
      },
    ] as FAQ[],
  },

  footer: {
    id: "story",
    blurb:
      "Zeevan crafts pure A2 Kankrej cow ghee using the ancestral Bilona method — for families who value tradition, transparency, and taste.",
    quickLinks: [
      { label: "How It's Made", href: "#process" },
      { label: "Why Kankrej", href: "#why-kankrej" },
      { label: "Benefits", href: "#benefits" },
      { label: "Order", href: "#order" },
      { label: "FAQ", href: "#faq" },
    ] as NavLink[],
    copyright: `© ${new Date().getFullYear()} Zeevan. All rights reserved.`,
  },
} as const;

export type Site = typeof site;

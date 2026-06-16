const mongoose = require("mongoose");

const homeViewConfigSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      default: "Pure Heritage in Every Drop",
      trim: true,
    },
    heroSubtitle: {
      type: String,
      default:
        "Slow-churned from the milk of grass-fed cows — golden clarity and aroma rooted in tradition.",
      trim: true,
    },
    primeSectionTitle: {
      type: String,
      default: "Prime Products",
      trim: true,
    },
    productTypeTitle: {
      type: String,
      default: "Shop by category",
      trim: true,
    },
    showPrimeSection: {
      type: Boolean,
      default: true,
    },
    showHomeSections: {
      type: Boolean,
      default: true,
    },
    showProductTypeSections: {
      type: Boolean,
      default: true,
    },
    productCardStyle: {
      type: String,
      enum: ["compact", "comfortable"],
      default: "compact",
    },
    /** Admin shop / pickup pin — shown on customer order tracking maps. */
    shopLocation: {
      name: { type: String, default: "Zeevan Shop", trim: true },
      line1: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
      postalCode: { type: String, default: "", trim: true },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    /** Web hero carousel — images or videos managed in admin. */
    heroSlides: [
      {
        id: { type: String, required: true },
        order: { type: Number, default: 0 },
        mediaType: { type: String, enum: ["image", "video"], default: "image" },
        url: { type: String, default: "", trim: true },
        title: { type: String, default: "", trim: true },
        subtitle: { type: String, default: "", trim: true },
        enabled: { type: Boolean, default: true },
      },
    ],
    /** Community / Instagram rail after Our Story on web home. */
    communitySection: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, default: "Our Community", trim: true },
      title: { type: String, default: "Loved by families, shared every day", trim: true },
      instagram: {
        handle: { type: String, default: "zeevan", trim: true },
        displayHandle: { type: String, default: "@zeevan", trim: true },
        followersLabel: { type: String, default: "18.4k followers", trim: true },
        followLabel: { type: String, default: "Follow", trim: true },
        url: { type: String, default: "https://instagram.com/zeevan", trim: true },
      },
      posts: [
        {
          id: { type: String, required: true },
          order: { type: Number, default: 0 },
          enabled: { type: Boolean, default: true },
          type: { type: String, enum: ["reel", "customer"], default: "reel" },
          tag: { type: String, default: "Reel", trim: true },
          imageUrl: { type: String, default: "", trim: true },
          views: { type: String, default: "", trim: true },
          likes: { type: String, default: "", trim: true },
          quote: { type: String, default: "", trim: true },
          author: {
            name: { type: String, default: "", trim: true },
            subtitle: { type: String, default: "", trim: true },
            avatar: { type: String, default: "", trim: true },
            brand: { type: Boolean, default: true },
          },
        },
      ],
    },
    /** “Ours vs ordinary ghee” compare block on web home. */
    compareSection: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, default: "What makes us different", trim: true },
      title: { type: String, default: "Ours vs ordinary ghee", trim: true },
      subtitle: {
        type: String,
        default: "Most shelves sell factory-processed fat. We sell heritage.",
        trim: true,
      },
      filmLabel: { type: String, default: "The Difference", trim: true },
      storyChapter: { type: String, default: "Chapter II", trim: true },
      openingLine: {
        type: String,
        default: "Two paths. One golden jar.",
        trim: true,
      },
      closingTagline: {
        type: String,
        default: "A2 milk · Bilona-churned · open-grazed · hand-poured.",
        trim: true,
      },
      oursLabel: { type: String, default: "Zeevan", trim: true },
      ordinaryLabel: { type: String, default: "Ordinary", trim: true },
      rows: [
        {
          id: { type: String, required: true },
          order: { type: Number, default: 0 },
          enabled: { type: Boolean, default: true },
          label: { type: String, default: "", trim: true },
          ours: { type: String, default: "", trim: true },
          ordinary: { type: String, default: "", trim: true },
          oursImageUrl: { type: String, default: "", trim: true },
          ordinaryImageUrl: { type: String, default: "", trim: true },
        },
      ],
    },
    /** Bilona process journey — web cinematic timeline + native cards. */
    processSection: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, default: "How it's made", trim: true },
      title: { type: String, default: "Six steps from pasture to jar", trim: true },
      subtitle: {
        type: String,
        default: "No shortcuts. No cream separation. Only curd-churned Bilona ghee.",
        trim: true,
      },
      journeyLabel: { type: String, default: "The Bilona journey", trim: true },
      filmLabel: { type: String, default: "Chapter I", trim: true },
      openingLine: {
        type: String,
        default: "From open pasture to golden jar — every step by hand.",
        trim: true,
      },
      steps: [
        {
          id: { type: String, required: true },
          order: { type: Number, default: 0 },
          enabled: { type: Boolean, default: true },
          title: { type: String, default: "", trim: true },
          description: { type: String, default: "", trim: true },
          imageUrl: { type: String, default: "", trim: true },
          imageFit: { type: String, default: "cover", trim: true },
          imagePosition: { type: String, default: "top center", trim: true },
        },
      ],
    },
    /** About Zeevan block on web home + about page (main story + sidebar extras). */
    aboutSection: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, default: "Our story", trim: true },
      title: { type: String, default: "Craft rooted in tradition", trim: true },
      body: {
        type: String,
        default:
          "Zeevan crafts pure A2 Kankrej cow ghee using the ancestral Bilona method — hand-churned, wood-fired, and bottled in small batches for families who value tradition and taste.",
        trim: true,
      },
      videoUrl: { type: String, default: "", trim: true },
      videoCaption: {
        type: String,
        default: "From grass-fed Kankrej cows to golden, grainy ghee.",
        trim: true,
      },
      photos: [
        {
          url: { type: String, default: "", trim: true },
          caption: { type: String, default: "", trim: true },
        },
      ],
      pageLead: {
        type: String,
        default: "Hand-churned Bilona ghee from indigenous Kankrej cows — slow, honest, and golden.",
        trim: true,
      },
      pullQuote: {
        type: String,
        default: "Nothing rushed.\nNothing added.\nOnly pure Bilona craft.",
        trim: true,
      },
      bodyContinued: { type: String, default: "", trim: true },
      heritage: {
        eyebrow: { type: String, default: "Why Kankrej", trim: true },
        title: { type: String, default: "The breed behind the gold", trim: true },
        body: { type: String, default: "", trim: true },
      },
      bilona: {
        eyebrow: { type: String, default: "Bilona craft", trim: true },
        title: { type: String, default: "Hand-churned, never hurried", trim: true },
        body: { type: String, default: "", trim: true },
      },
      origin: {
        eyebrow: { type: String, default: "Our roots", trim: true },
        title: { type: String, default: "Born in Gujarat, made for Indian kitchens", trim: true },
        body: { type: String, default: "", trim: true },
      },
      values: [
        {
          title: { type: String, default: "", trim: true },
          body: { type: String, default: "", trim: true },
        },
      ],
      highlights: [
        {
          value: { type: String, default: "", trim: true },
          label: { type: String, default: "", trim: true },
          description: { type: String, default: "", trim: true },
        },
      ],
      sidebarStats: [
        {
          value: { type: String, default: "", trim: true },
          label: { type: String, default: "", trim: true },
        },
      ],
      mission: {
        eyebrow: { type: String, default: "Mission", trim: true },
        title: { type: String, default: "Good food should feel unmistakably real", trim: true },
        paragraphs: [{ type: String, trim: true }],
      },
      pillars: [
        {
          id: { type: String, default: "", trim: true },
          icon: { type: String, default: "leaf-outline", trim: true },
          title: { type: String, default: "", trim: true },
          body: { type: String, default: "", trim: true },
          enabled: { type: Boolean, default: true },
        },
      ],
      craft: {
        eyebrow: { type: String, default: "The process", trim: true },
        title: { type: String, default: "From farm to your morning roti", trim: true },
        steps: [
          {
            id: { type: String, default: "", trim: true },
            label: { type: String, default: "", trim: true },
            title: { type: String, default: "", trim: true },
            body: { type: String, default: "", trim: true },
          },
        ],
      },
      ctaBand: {
        title: { type: String, default: "Ready to taste the difference?", trim: true },
        body: {
          type: String,
          default: "Explore bestsellers, earn rewards on your first order, and track delivery every step of the way.",
          trim: true,
        },
        ctaLabel: { type: String, default: "Browse the shop", trim: true },
        ctaSecondaryLabel: { type: String, default: "Contact support", trim: true },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeViewConfig", homeViewConfigSchema);

/**
 * Copy and structured content for editorial / marketing pages.
 */
import { SUPPORT_EMAIL_DISPLAY } from "./appContent";
import { RUNTIME_SUPPORT_WHATSAPP_URL } from "../constants/runtimeConfig";

export const EDITORIAL_PRESS_LOGOS = ["Mint", "Vogue India", "Condé Nast Traveller", "The Hindu", "Economic Times"];

export const ABOUT_PAGE = {
  kicker: "Our story",
  headline: "Heritage pantry essentials, cared for end to end",
  subline:
    "Zeevan began in family kitchens — where ghee, rice, and spice were never commodities, but rituals. We built a pantry for homes that expect traceability, small batches, and honest craft.",
  sections: [
    {
      key: "story",
      title: "Our story",
      body:
        "What started as sourcing trips to farms and mills became a daily promise: staples that taste like someone checked every batch. We work with partners who share our pace — slower, smaller, and transparent — so your shelf stays honest season after season.",
      image: require("../../assets/marketing/hero-slide-1.jpg"),
      imageFirst: true,
    },
    {
      key: "source",
      title: "How we source",
      body:
        "Every SKU maps to a place and a person. We taste, lab-check where needed, and publish what we can about origin and process. When a harvest shifts, we adjust — never masking quality with marketing noise.",
      image: require("../../assets/marketing/hero-slide-2.jpg"),
      imageFirst: false,
    },
    {
      key: "makers",
      title: "Meet the makers",
      body:
        "From cold-pressed oil cooperatives to saffron growers in the high valleys, our makers work in human-scale lots. You will find their names in journal stories and on select product pages — because credit belongs at the source.",
      image: require("../../assets/marketing/hero-slide-3.jpg"),
      imageFirst: true,
    },
  ],
  ctaLabel: "Shop the collection",
};

export const CONTACT_PAGE = {
  kicker: "Contact",
  headline: "We read every note",
  subline: "Questions about an order, wholesale, or press? Write to us — we reply within one business day.",
  form: {
    nameLabel: "Your name",
    emailLabel: "Email",
    subjectLabel: "Subject",
    messageLabel: "Message",
    submitLabel: "Send message",
    successToast: "Thanks — your message is on its way.",
  },
  infoTitle: "Visit & reach",
  emailLabel: "Email",
  phoneLabel: "Phone",
  hoursLabel: "Hours",
  hoursValue: "Mon–Sat · 9:00–18:00 IST",
  addressLabel: "Studio",
  addressValue: "Ahmedabad, Gujarat · India",
  whatsappLabel: "Chat on WhatsApp",
  whatsappUrl: RUNTIME_SUPPORT_WHATSAPP_URL,
  email: SUPPORT_EMAIL_DISPLAY,
  phone: "+91 98765 43210",
};

export const FAQ_PAGE = {
  kicker: "Help",
  headline: "Frequently asked questions",
  subline: "Shipping, returns, ingredients, and ordering — search or browse by topic.",
  searchPlaceholder: "Search questions…",
  helpfulPrompt: "Was this helpful?",
  categories: [
    {
      key: "orders",
      title: "Orders & delivery",
      items: [
        {
          id: "delivery-time",
          q: "When will my order arrive?",
          a: "Most serviceable pin codes receive same-day or next-day delivery. Track live status from your account orders page once the order is confirmed.",
        },
        {
          id: "change-address",
          q: "Can I change my delivery address?",
          a: "Yes — before packing begins. Open your order from Orders and use the address update option, or contact us with your order ID.",
        },
        {
          id: "cod",
          q: "Do you offer Cash on Delivery?",
          a: "Yes, where available at checkout. Online payment via Razorpay is also supported for faster confirmation.",
        },
      ],
    },
    {
      key: "returns",
      title: "Returns & refunds",
      items: [
        {
          id: "return-window",
          q: "What is your return window?",
          a: "Unopened pantry goods in original packaging may be returned within 30 days of delivery unless noted otherwise on the product page.",
        },
        {
          id: "refund-time",
          q: "How long do refunds take?",
          a: "Approved refunds are initiated within 3–5 business days. Bank timelines may add 5–7 days depending on your provider.",
        },
      ],
    },
    {
      key: "product",
      title: "Products & sourcing",
      items: [
        {
          id: "batch-fresh",
          q: "How fresh are small-batch items?",
          a: "We rotate inventory quickly and print batch-friendly guidance on packs. If you ever receive something that feels off, contact us — we will make it right.",
        },
        {
          id: "allergens",
          q: "Where can I find allergen information?",
          a: "Ingredient and allergen statements live on each product page under Details. When in doubt, write to us before ordering.",
        },
      ],
    },
  ],
};

function policyBlocks(paragraphs) {
  return paragraphs.map((text, i) => ({ type: "p", id: `p-${i}`, text }));
}

export const EDITORIAL_POLICIES = {
  privacy: {
    metaRoute: "privacy",
    title: "Privacy Policy",
    lastUpdated: "1 May 2026",
    toc: [
      { id: "collect", label: "What we collect" },
      { id: "use", label: "How we use data" },
      { id: "share", label: "Sharing" },
      { id: "rights", label: "Your rights" },
      { id: "contact", label: "Contact" },
    ],
    blocks: [
      { type: "h2", id: "collect", text: "What we collect" },
      ...policyBlocks([
        "We collect information you provide when you create an account, place an order, or contact support — such as name, phone, email, and delivery address.",
        "We also collect technical data (device, browser, approximate location) to keep the service secure and improve performance.",
      ]),
      { type: "h2", id: "use", text: "How we use data" },
      ...policyBlocks([
        "Order fulfilment, customer support, fraud prevention, and product recommendations use your data only as needed for those purposes.",
        "With your consent, we may send pantry updates or offers. You can opt out anytime from notification preferences or email footers.",
      ]),
      { type: "h2", id: "share", text: "Sharing" },
      ...policyBlocks([
        "We share data with payment, logistics, and infrastructure partners under contract. We do not sell personal information.",
      ]),
      { type: "h2", id: "rights", text: "Your rights" },
      ...policyBlocks([
        "You may request access, correction, or deletion of personal data by emailing support. We respond within applicable legal timelines.",
      ]),
      { type: "h2", id: "contact", text: "Contact" },
      ...policyBlocks([`Privacy questions: ${SUPPORT_EMAIL_DISPLAY}.`]),
    ],
  },
  terms: {
    metaRoute: "terms",
    title: "Terms of Service",
    lastUpdated: "1 May 2026",
    toc: [
      { id: "use", label: "Using Zeevan" },
      { id: "orders", label: "Orders & pricing" },
      { id: "liability", label: "Liability" },
    ],
    blocks: [
      { type: "h2", id: "use", text: "Using Zeevan" },
      ...policyBlocks([
        "By using our app or website you agree to these terms and our policies. You must provide accurate account and delivery information.",
      ]),
      { type: "h2", id: "orders", text: "Orders & pricing" },
      ...policyBlocks([
        "Prices and availability may change. We may cancel orders affected by stock or compliance issues with a full refund.",
      ]),
      { type: "h2", id: "liability", text: "Liability" },
      ...policyBlocks([
        "Zeevan is provided as-is within limits permitted by law. Our liability for any claim is limited to the amount you paid for the affected order.",
      ]),
    ],
  },
  shipping: {
    metaRoute: "shipping",
    title: "Shipping Policy",
    lastUpdated: "1 May 2026",
    toc: [
      { id: "areas", label: "Service areas" },
      { id: "fees", label: "Fees & timing" },
      { id: "issues", label: "Delivery issues" },
    ],
    blocks: [
      { type: "h2", id: "areas", text: "Service areas" },
      ...policyBlocks([
        "We deliver to pin codes where our logistics partners operate. Unserviceable areas can join the waitlist from the location picker.",
      ]),
      { type: "h2", id: "fees", text: "Fees & timing" },
      ...policyBlocks([
        "Delivery fees and free-shipping thresholds appear at checkout. Same-day slots depend on cut-off times shown when you order.",
      ]),
      { type: "h2", id: "issues", text: "Delivery issues" },
      ...policyBlocks([
        "If a package arrives damaged or late, contact us within 48 hours with photos where applicable. We will replace or refund eligible items.",
      ]),
    ],
  },
  returns: {
    metaRoute: "returns",
    title: "Returns & Refunds",
    lastUpdated: "1 May 2026",
    toc: [
      { id: "eligible", label: "Eligible items" },
      { id: "process", label: "How to return" },
      { id: "refunds", label: "Refunds" },
    ],
    blocks: [
      { type: "h2", id: "eligible", text: "Eligible items" },
      ...policyBlocks([
        "Sealed, unopened goods in resaleable condition may be returned within 30 days unless marked final sale. Perishables opened for quality checks are handled case by case.",
      ]),
      { type: "h2", id: "process", text: "How to return" },
      ...policyBlocks([
        "Start a return from your order detail screen or email support with your order ID. We will arrange pickup or provide return instructions.",
      ]),
      { type: "h2", id: "refunds", text: "Refunds" },
      ...policyBlocks([
        "Refunds go to the original payment method once we receive and inspect the return. COD orders are refunded via UPI or bank transfer.",
      ]),
    ],
  },
};

export const BLOG_POSTS = [
  {
    slug: "slow-ghee-season",
    title: "Slow ghee season: what changes in the jar",
    excerpt: "Why winter batches taste richer — and how we test every lot before it ships.",
    author: "Zeevan editorial",
    date: "2026-04-12",
    readingMinutes: 6,
    cover: require("../../assets/marketing/hero-slide-1.jpg"),
    featured: true,
    body: [
      "Ghee is patient work. In cooler months, butter clarifies more evenly, and the nutty note deepens without browning too fast.",
      "Our partners send samples from each kettle. We check aroma, moisture, and free fatty acid markers before approving a batch for packing.",
      "At home, store ghee away from direct heat. A clean spoon keeps the jar honest for weeks.",
    ],
  },
  {
    slug: "saffron-at-altitude",
    title: "Saffron at altitude",
    excerpt: "A short field note from the harvest ridge.",
    author: "Zeevan editorial",
    date: "2026-03-28",
    readingMinutes: 4,
    cover: require("../../assets/marketing/hero-slide-2.jpg"),
    featured: false,
    body: [
      "Threads are picked before sunrise when colour is strongest. Each gram travels in light-proof packs within days of drying.",
      "We never blend origins without saying so on the label — transparency is part of the spice.",
    ],
  },
  {
    slug: "basmati-resting",
    title: "Why basmati likes to rest",
    excerpt: "Aging, moisture, and the long-grain test.",
    author: "Zeevan editorial",
    date: "2026-03-05",
    readingMinutes: 5,
    cover: require("../../assets/marketing/hero-slide-3.jpg"),
    featured: false,
    body: [
      "Aged basmati sheds excess moisture so grains stay separate after cooking. We source lots that pass our length and breakage checks.",
      "Rinse until water runs clear, soak twenty minutes, and use a wide pot — the simplest upgrade to biryani night.",
    ],
  },
  {
    slug: "pantry-spring-clean",
    title: "A gentle spring pantry reset",
    excerpt: "Rotate oils, audit spices, and restock without waste.",
    author: "Zeevan editorial",
    date: "2026-02-18",
    readingMinutes: 7,
    cover: require("../../assets/marketing/hero-slide-07.png"),
    featured: false,
    body: [
      "Start with oils and whole spices — they lose potency faster than legumes. Smell and taste before you toss; stale spice lacks bloom.",
      "Group staples by frequency of use. Everyday items at arm's reach; festival packs higher on the shelf.",
    ],
  },
];

export function getBlogPost(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug) || null;
}

export function getRelatedPosts(slug, limit = 3) {
  return BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, limit);
}

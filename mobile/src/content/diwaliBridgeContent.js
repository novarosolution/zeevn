/**
 * Home Diwali hero — bg + real catalog product shots (same as shop cards).
 */
export const DIWALI_BRIDGE_SECTION = {
  eyebrow: "Diwali Craft Sale",
  titleBefore: "Manao Yeh Diwali",
  titleHighlight: "Bilona",
  titleAfter: "Wali.",
  body: "The biggest craft sale of the year — A2 ghee, cold-pressed tel & forest honey.",
  offerMain: "FLAT 25% OFF",
  offerExtra: "Extra 5% OFF on prepaid orders",
  codeLabel: "USE CODE",
  code: "BILONA25",
  cta: "Shop Pure",
  badgeTitle: "CRAFT",
  badgeSub: "Slow · Pure · Local",
  badgeTag: "SALE",
  /** Festive bg only — products are overlaid from catalog assets. */
  image: require("../../assets/diwali-sale-bg-4k.jpg"),
  /** Same product photography as home/shop cards. */
  products: [
    { key: "ghee", image: require("../../assets/zeevan-ghee-gen.jpg"), label: "A2 Ghee" },
    { key: "tel", image: require("../../assets/zeevan-tel-gen.jpg"), label: "Cold-pressed Tel" },
    { key: "honey", image: require("../../assets/zeevan-honey-gen.jpg"), label: "Forest Honey" },
  ],
};

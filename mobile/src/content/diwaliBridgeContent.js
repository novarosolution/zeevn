/**
 * Home Diwali Craft Sale hero — festive bg + premium catalog product panels.
 */
export const DIWALI_BRIDGE_SECTION = {
  eyebrow: "Diwali Craft Sale",
  titleBefore: "Manao Yeh Diwali",
  titleHighlight: "Bilona",
  titleAfter: "Wali.",
  body: "The biggest craft sale of the year — A2 ghee, cold-pressed oil & forest honey.",
  offerMain: "FLAT 25% OFF",
  offerExtra: "Extra 5% OFF on prepaid orders",
  codeLabel: "USE CODE",
  code: "BILONA25",
  cta: "Shop Pure",
  badgeTitle: "CRAFT",
  badgeSub: "Slow. Pure. Local.",
  badgeTag: "SALE",
  /** Festive stage — diyas / mandala / bokeh. */
  image: require("../../assets/diwali-sale-bg-4k.jpg"),
  /**
   * Overlapping portrait panels (generated from brand product photography).
   * Order: center hero = ghee, left = tel, right = honey.
   */
  products: [
    { key: "ghee", image: require("../../assets/diwali-panel-ghee.jpg"), label: "A2 Ghee" },
    { key: "tel", image: require("../../assets/diwali-panel-tel.jpg"), label: "Cold-pressed Tel" },
    { key: "honey", image: require("../../assets/diwali-panel-honey.jpg"), label: "Forest Honey" },
  ],
};

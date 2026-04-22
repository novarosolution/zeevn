/**
 * Shared “heritage / Golden Alchemy” palette and display font names for customer UI.
 * Loaded in App.js: Playfair Display (see FONT_DISPLAY_*).
 */

export const FONT_DISPLAY = "PlayfairDisplay_700Bold";
export const FONT_DISPLAY_SEMI = "PlayfairDisplay_600SemiBold";
export const FONT_DISPLAY_ITALIC = "PlayfairDisplay_400Regular_Italic";

export const ALCHEMY = {
  cream: "#FAF3ED",
  creamDeep: "#F0E6D8",
  creamAlt: "#FFF9F5",
  creamAltDeep: "#F5EBE0",
  /** Subtle top “light” for multi-stop gradients */
  creamHighlight: "#FFFDFB",
  brown: "#744F1C",
  brownMuted: "#5C3F16",
  gold: "#C9A227",
  goldSoft: "rgba(201, 162, 39, 0.14)",
  pillInactive: "#EDE4D7",
  cardBeige: "#F9EFE6",
  cardBg: "#FFFCF8",
  /** Hairline / chrome */
  line: "rgba(116, 79, 28, 0.12)",
};

/**
 * Background gradient for CustomerScreenShell (and screens that opt out of the default theme gradient).
 * Light mode: four-stop editorial wash (highlight → warm mid → cream → depth).
 * Dark mode: layered near-black stops for a soft “velvet” backdrop.
 */
export function getCustomerShellGradient(isDark, themeColors) {
  const c = themeColors;
  if (isDark) {
    return [c.background, "#0E0C0A", "#141210", c.backgroundGradientEnd];
  }
  return [ALCHEMY.creamHighlight, "#FDF6EF", ALCHEMY.cream, ALCHEMY.creamDeep];
}

/** Stops for `getCustomerShellGradient` (four stops in light and dark). */
export const CUSTOMER_SHELL_GRADIENT_LOCATIONS = [0, 0.28, 0.54, 1];

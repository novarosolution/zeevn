/**
 * Tone palettes for admin badges, stat tiles and buttons — one place so order status, payment, rider and zone
 * colours read the same everywhere on the desk. Each tone gives a readable text colour, a soft tinted fill and a
 * hairline border for light mode, and brighter-text / deeper-fill versions for dark mode.
 */
const LIGHT = {
  neutral: { fg: "#5B5646", bg: "rgba(31, 51, 31, 0.07)", border: "rgba(31, 51, 31, 0.1)", solid: "#5B5646" },
  green: { fg: "#23694C", bg: "rgba(35, 105, 76, 0.12)", border: "rgba(35, 105, 76, 0.22)", solid: "#23694C" },
  olive: { fg: "#4F6430", bg: "rgba(85, 107, 50, 0.13)", border: "rgba(85, 107, 50, 0.24)", solid: "#556B32" },
  gold: { fg: "#8F5E14", bg: "rgba(201, 162, 39, 0.17)", border: "rgba(169, 119, 46, 0.3)", solid: "#B8842C" },
  red: { fg: "#A8402C", bg: "rgba(184, 68, 47, 0.11)", border: "rgba(184, 68, 47, 0.24)", solid: "#B8442F" },
  blue: { fg: "#2F5F86", bg: "rgba(61, 107, 140, 0.12)", border: "rgba(61, 107, 140, 0.24)", solid: "#3D6B8C" },
  teal: { fg: "#1B6A62", bg: "rgba(31, 111, 91, 0.12)", border: "rgba(31, 111, 91, 0.24)", solid: "#1F6F5B" },
  purple: { fg: "#6B4F8E", bg: "rgba(107, 91, 149, 0.12)", border: "rgba(107, 91, 149, 0.24)", solid: "#6B5B95" },
};

const DARK = {
  neutral: { fg: "#CEC7BF", bg: "rgba(255, 255, 255, 0.08)", border: "rgba(255, 255, 255, 0.12)", solid: "#A8A29E" },
  green: { fg: "#7FD1A8", bg: "rgba(74, 222, 128, 0.14)", border: "rgba(74, 222, 128, 0.26)", solid: "#4ADE80" },
  olive: { fg: "#C4D088", bg: "rgba(168, 184, 108, 0.16)", border: "rgba(168, 184, 108, 0.3)", solid: "#A8B86C" },
  gold: { fg: "#EBC37E", bg: "rgba(232, 188, 132, 0.16)", border: "rgba(232, 188, 132, 0.3)", solid: "#E8BC84" },
  red: { fg: "#F59B8B", bg: "rgba(248, 113, 113, 0.15)", border: "rgba(248, 113, 113, 0.3)", solid: "#F87171" },
  blue: { fg: "#8DBBE0", bg: "rgba(96, 165, 250, 0.15)", border: "rgba(96, 165, 250, 0.28)", solid: "#60A5FA" },
  teal: { fg: "#79D3C4", bg: "rgba(45, 212, 191, 0.14)", border: "rgba(45, 212, 191, 0.26)", solid: "#2DD4BF" },
  purple: { fg: "#BDA7E3", bg: "rgba(167, 139, 250, 0.15)", border: "rgba(167, 139, 250, 0.28)", solid: "#A78BFA" },
};

export const ADMIN_TONE_NAMES = Object.keys(LIGHT);

export function getAdminTone(name, isDark) {
  const table = isDark ? DARK : LIGHT;
  return table[name] || table.neutral;
}

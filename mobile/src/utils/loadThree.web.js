/** Web-only dynamic import for Three.js (keeps native bundle lean). */
export async function loadThree() {
  const mod = await import("three");
  return mod;
}

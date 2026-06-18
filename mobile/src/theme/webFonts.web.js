/** Web display face — Fraunces via non-blocking Google Fonts CSS (`display=swap`). */
export const WEB_DISPLAY_FONT = "Fraunces";

export const WEB_GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;700&family=Hanken+Grotesk:wght@400;500;600;700&display=swap";

function ensureLink(rel, href, attrs = {}) {
  if (typeof document === "undefined" || !href) return;
  const key = `zeevan-${rel}-${href}`;
  if (document.querySelector(`link[data-zeevan-key="${key}"]`)) return;
  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  link.setAttribute("data-zeevan-key", key);
  Object.entries(attrs).forEach(([name, value]) => {
    if (value != null) link.setAttribute(name, value);
  });
  document.head.appendChild(link);
}

/** Non-blocking Google Fonts with `font-display: swap` — keeps TTF packs out of the JS bundle. */
export function initWebFonts() {
  if (typeof document === "undefined") return;

  ensureLink("preconnect", "https://fonts.googleapis.com");
  ensureLink("preconnect", "https://fonts.gstatic.com", { crossorigin: "" });

  const styleId = "zeevan-web-fonts-async";
  if (!document.getElementById(styleId)) {
    const link = document.createElement("link");
    link.id = styleId;
    link.rel = "stylesheet";
    link.href = WEB_GOOGLE_FONTS_HREF;
    link.media = "print";
    link.onload = () => {
      link.media = "all";
    };
    document.head.appendChild(link);
  }
}

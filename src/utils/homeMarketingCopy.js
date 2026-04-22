import { HOME_HERO_SUBTITLE_DEFAULT, HOME_HERO_TITLE_DEFAULT } from "../content/appContent";

export { HOME_HERO_SUBTITLE_DEFAULT, HOME_HERO_TITLE_DEFAULT };

/** Remove time-based delivery estimates from marketing strings (e.g. "30 min", "in 10 minutes"). */
export function stripDeliveryTimeCopy(text) {
  if (text == null || typeof text !== "string") return text;
  let s = text
    .replace(/\bdelivery\s+in\s+\d{1,3}\s*(min|mins|minute|minutes)\b/gi, "")
    .replace(/\bin\s+\d{1,3}\s*(min|mins|minute|minutes)\b/gi, "")
    .replace(/\bwithin\s+\d{1,3}\s*(min|mins|minute|minutes)\b/gi, "")
    .replace(/\b\d{1,3}\s*(min|mins|minute|minutes)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[,•·]\s*[,•·]\s*/g, ", ")
    .replace(/^\s*[,•·]\s*|\s*[,•·]\s*$/g, "")
    .trim();
  return s;
}

export function normalizeHeroTitle(raw) {
  const cleaned = stripDeliveryTimeCopy(String(raw || "").trim());
  if (cleaned.length >= 3) return cleaned;
  return HOME_HERO_TITLE_DEFAULT;
}

export function normalizeHeroSubtitle(raw) {
  const cleaned = stripDeliveryTimeCopy(String(raw || "").trim());
  if (cleaned.length >= 3) return cleaned;
  return HOME_HERO_SUBTITLE_DEFAULT;
}

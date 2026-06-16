/**
 * Typography roles — serif for headings, sans-serif for body/UI.
 * Web headings: Fraunces. Native headings: Fraunces. Body: Hanken Grotesk.
 */
import { FONT_DISPLAY, FONT_DISPLAY_ITALIC, FONT_DISPLAY_SEMI } from "./customerAlchemy";
import { fonts } from "./tokens";

/** Page titles, section titles, product H1, pull quotes. */
export const FONT_HEADING = FONT_DISPLAY;
export const FONT_HEADING_SEMI = FONT_DISPLAY_SEMI;
export const FONT_HEADING_ITALIC = FONT_DISPLAY_ITALIC;

/** Body copy, labels, meta, descriptions, form text. */
export const FONT_BODY = fonts.regular;
export const FONT_BODY_MEDIUM = fonts.medium;
export const FONT_BODY_SEMIBOLD = fonts.semibold;
export const FONT_BODY_BOLD = fonts.bold;
export const FONT_BODY_EXTRA_BOLD = fonts.extrabold;

/** Prices, totals, counts, KPI numbers — always sans for legibility. */
export const FONT_PRICE = fonts.bold;
export const FONT_PRICE_MEDIUM = fonts.semibold;

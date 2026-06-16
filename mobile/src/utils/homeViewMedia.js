import { buildAboutPageExtrasDefaults } from "../content/aboutPageContent";
import {
  buildCommunitySectionDefaults,
  getCommunityPostImageFallback,
} from "../content/communityHomeContent";
import {
  buildCompareSectionDefaults,
  getCompareRowImageFallback,
} from "../content/compareHomeContent";
import {
  buildProcessSectionDefaults,
  getProcessStepImageFallback,
} from "../content/processHomeContent";
import { HOME_HERO_APP_MAX_SLIDES } from "../constants/marketingAssets";

function asTrimmedString(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function normalizeMediaType(value) {
  return asTrimmedString(value).toLowerCase() === "video" ? "video" : "image";
}

export function normalizeHeroSlide(slide, index = 0) {
  if (!slide || typeof slide !== "object") return null;
  const url = asTrimmedString(slide.url);
  if (!url) return null;
  return {
    id: asTrimmedString(slide.id) || `slide-${index + 1}`,
    order: Number.isFinite(Number(slide.order)) ? Number(slide.order) : index,
    mediaType: normalizeMediaType(slide.mediaType),
    url,
    title: asTrimmedString(slide.title),
    subtitle: asTrimmedString(slide.subtitle),
    enabled: slide.enabled !== false,
  };
}

export function normalizeHeroSlides(slides) {
  if (!Array.isArray(slides)) return [];
  return slides
    .map((slide, index) => normalizeHeroSlide(slide, index))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

export function getActiveHeroSlides(slides) {
  return normalizeHeroSlides(slides).filter((slide) => slide.enabled);
}

/** Home compact banner — images only, capped slide count (no video rails). */
export const COMPACT_HERO_MAX_SLIDES = 2;

export function getCompactHeroSlides(slides) {
  return getActiveHeroSlides(slides)
    .filter((slide) => slide.mediaType !== "video")
    .slice(0, COMPACT_HERO_MAX_SLIDES);
}

/** Map bundled marketing slides → hero slider shape (web fallback). */
export function mapMarketingSlidesToHero(marketingSlides = []) {
  return marketingSlides
    .filter((slide) => slide?.image)
    .map((slide, index) => ({
    id: slide.key || `marketing-${index}`,
    order: index,
    mediaType: "image",
    url: slide.image,
    title: slide.title || "",
    subtitle: slide.subtitle || "",
    cta: slide.cta || "Shop now",
    enabled: true,
    variant: slide.variant || "",
    badge: slide.badge || "",
    contentPosition: slide.contentPosition || "center",
    heightRatio: slide.heightRatio,
    layout: slide.layout || "",
    imageFit: slide.imageFit || "",
    captionAlign: slide.captionAlign || "",
    captionMode: slide.captionMode || "",
    captionZone: slide.captionZone || "",
    webBanner: Boolean(slide.webBanner),
  }));
}

export function getCompactMarketingHeroSlides(marketingSlides = []) {
  return mapMarketingSlidesToHero(marketingSlides).slice(0, COMPACT_HERO_MAX_SLIDES);
}

/** Native app hero — images only, up to 3 slides. */
export function getAppHeroSlides(slides) {
  return getActiveHeroSlides(slides)
    .filter((slide) => slide.mediaType !== "video")
    .slice(0, HOME_HERO_APP_MAX_SLIDES);
}

export function getAppMarketingHeroSlides(marketingSlides = []) {
  return mapMarketingSlidesToHero(marketingSlides).slice(0, HOME_HERO_APP_MAX_SLIDES);
}

function normalizeAboutPhoto(photo) {
  if (!photo || typeof photo !== "object") return null;
  const url = asTrimmedString(photo.url);
  if (!url) return null;
  return { url, caption: asTrimmedString(photo.caption) };
}

export const ABOUT_SECTION_DEFAULTS = {
  enabled: true,
  eyebrow: "Our story",
  title: "Craft rooted in tradition",
  body:
    "Zeevan brings ghee, tel, masala & Haldar honey to your kitchen — small batches, honest labels, live delivery tracking.",
  videoUrl: "",
  videoCaption: "From farm to pantry.",
  photos: [],
};

function normalizeHighlight(item, index, fallback) {
  if (!item || typeof item !== "object") return fallback;
  return {
    value: asTrimmedString(item.value, fallback?.value),
    label: asTrimmedString(item.label, fallback?.label),
    description: asTrimmedString(item.description, fallback?.description),
  };
}

function normalizeSidebarStat(item, index, fallback) {
  if (!item || typeof item !== "object") return fallback;
  return {
    value: asTrimmedString(item.value, fallback?.value),
    label: asTrimmedString(item.label, fallback?.label),
  };
}

function normalizePillar(item, index) {
  if (!item || typeof item !== "object") return null;
  const title = asTrimmedString(item.title);
  if (!title) return null;
  return {
    id: asTrimmedString(item.id) || `pillar-${index + 1}`,
    icon: asTrimmedString(item.icon, "leaf-outline"),
    title,
    body: asTrimmedString(item.body),
    enabled: item.enabled !== false,
  };
}

function normalizeCraftStep(item, index) {
  if (!item || typeof item !== "object") return null;
  const title = asTrimmedString(item.title);
  if (!title) return null;
  return {
    id: asTrimmedString(item.id) || `craft-${index + 1}`,
    label: asTrimmedString(item.label, String(index + 1).padStart(2, "0")),
    title,
    body: asTrimmedString(item.body),
  };
}

function normalizeStorySubsection(section, fallback) {
  const base = fallback || { eyebrow: "", title: "", body: "" };
  if (!section || typeof section !== "object") return base;
  return {
    eyebrow: asTrimmedString(section.eyebrow, base.eyebrow),
    title: asTrimmedString(section.title, base.title),
    body: asTrimmedString(section.body, base.body),
  };
}

function normalizeValueItem(item) {
  if (!item || typeof item !== "object") return null;
  const title = asTrimmedString(item.title);
  if (!title) return null;
  return { title, body: asTrimmedString(item.body) };
}

export function normalizeAboutSection(about) {
  const extras = buildAboutPageExtrasDefaults();
  if (!about || typeof about !== "object") {
    return { ...ABOUT_SECTION_DEFAULTS, ...extras, photos: [] };
  }
  const photos = Array.isArray(about.photos)
    ? about.photos.map(normalizeAboutPhoto).filter(Boolean)
    : [];

  const highlightsIn = Array.isArray(about.highlights) ? about.highlights : [];
  const highlights =
    highlightsIn.length > 0
      ? highlightsIn
          .map((item, i) => normalizeHighlight(item, i, extras.highlights[i]))
          .filter((h) => h?.value)
      : extras.highlights;

  const statsIn = Array.isArray(about.sidebarStats) ? about.sidebarStats : [];
  const sidebarStats =
    statsIn.length > 0
      ? statsIn
          .map((item, i) => normalizeSidebarStat(item, i, extras.sidebarStats[i]))
          .filter((s) => s?.value)
      : extras.sidebarStats;

  const pillarsIn = Array.isArray(about.pillars) ? about.pillars : [];
  const pillars =
    pillarsIn.length > 0
      ? pillarsIn.map(normalizePillar).filter(Boolean)
      : extras.pillars;

  const missionIn = about.mission && typeof about.mission === "object" ? about.mission : {};
  const missionParagraphs = Array.isArray(missionIn.paragraphs)
    ? missionIn.paragraphs.map((p) => asTrimmedString(p)).filter(Boolean)
    : extras.mission.paragraphs;

  const craftIn = about.craft && typeof about.craft === "object" ? about.craft : {};
  const craftStepsIn = Array.isArray(craftIn.steps) ? craftIn.steps : [];
  const craftSteps =
    craftStepsIn.length > 0
      ? craftStepsIn.map(normalizeCraftStep).filter(Boolean)
      : extras.craft.steps;

  const ctaIn = about.ctaBand && typeof about.ctaBand === "object" ? about.ctaBand : {};

  const valuesIn = Array.isArray(about.values) ? about.values : [];
  const values =
    valuesIn.length > 0
      ? valuesIn.map(normalizeValueItem).filter(Boolean)
      : extras.values;

  return {
    enabled: about.enabled !== false,
    eyebrow: asTrimmedString(about.eyebrow, ABOUT_SECTION_DEFAULTS.eyebrow),
    title: asTrimmedString(about.title, ABOUT_SECTION_DEFAULTS.title),
    body: asTrimmedString(about.body, ABOUT_SECTION_DEFAULTS.body),
    videoUrl: asTrimmedString(about.videoUrl),
    videoCaption: asTrimmedString(about.videoCaption, ABOUT_SECTION_DEFAULTS.videoCaption),
    photos,
    pageLead: asTrimmedString(about.pageLead, extras.pageLead),
    pullQuote: asTrimmedString(about.pullQuote, extras.pullQuote),
    bodyContinued: asTrimmedString(about.bodyContinued, extras.bodyContinued),
    heritage: normalizeStorySubsection(about.heritage, extras.heritage),
    bilona: normalizeStorySubsection(about.bilona, extras.bilona),
    origin: normalizeStorySubsection(about.origin, extras.origin),
    values,
    highlights,
    sidebarStats,
    mission: {
      eyebrow: asTrimmedString(missionIn.eyebrow, extras.mission.eyebrow),
      title: asTrimmedString(missionIn.title, extras.mission.title),
      paragraphs: missionParagraphs.length ? missionParagraphs : extras.mission.paragraphs,
    },
    pillars,
    craft: {
      eyebrow: asTrimmedString(craftIn.eyebrow, extras.craft.eyebrow),
      title: asTrimmedString(craftIn.title, extras.craft.title),
      steps: craftSteps,
    },
    ctaBand: {
      title: asTrimmedString(ctaIn.title, extras.ctaBand.title),
      body: asTrimmedString(ctaIn.body, extras.ctaBand.body),
      ctaLabel: asTrimmedString(ctaIn.ctaLabel, extras.ctaBand.ctaLabel),
      ctaSecondaryLabel: asTrimmedString(ctaIn.ctaSecondaryLabel, extras.ctaBand.ctaSecondaryLabel),
    },
  };
}

/** Resolved about content for home + dedicated about page. */
export function resolveAboutPageDisplay(section) {
  const normalized = normalizeAboutSection(section);
  if (!normalized.enabled) return null;
  return normalized;
}

export function hasAboutMedia(about) {
  const section = normalizeAboutSection(about);
  if (!section.enabled) return false;
  return Boolean(
    section.videoUrl || section.photos.length > 0 || section.body || section.title
  );
}

export function newHeroSlideId() {
  return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newCommunityPostId() {
  return `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newCompareRowId() {
  return `compare-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newProcessStepId() {
  return `process-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizePostType(value) {
  return asTrimmedString(value).toLowerCase() === "customer" ? "customer" : "reel";
}

function normalizeCommunityAuthor(author, fallback = {}, type = "reel") {
  const src = author && typeof author === "object" ? author : {};
  const name = asTrimmedString(src.name, fallback.name || "");
  const avatarFallback = name ? name.charAt(0).toUpperCase() : "K";
  const brand =
    type === "customer"
      ? src.brand === true || src.brand === "true"
      : src.brand !== false && src.brand !== "false";
  return {
    name,
    subtitle: asTrimmedString(src.subtitle, fallback.subtitle || ""),
    avatar: asTrimmedString(src.avatar, fallback.avatar || avatarFallback) || avatarFallback,
    brand,
  };
}

export function normalizeCommunityPost(post, index = 0) {
  if (!post || typeof post !== "object") return null;
  const id = asTrimmedString(post.id) || `community-${index + 1}`;
  const type = normalizePostType(post.type);
  const fallbackAuthor =
    type === "customer"
      ? { name: "", subtitle: "", avatar: "C", brand: false }
      : { name: "zeevan", subtitle: "", avatar: "Z", brand: true };
  return {
    id,
    order: Number.isFinite(Number(post.order)) ? Number(post.order) : index,
    enabled: post.enabled !== false,
    type,
    tag: asTrimmedString(post.tag, type === "customer" ? "Customer" : "Reel"),
    imageUrl: asTrimmedString(post.imageUrl),
    views: asTrimmedString(post.views),
    likes: asTrimmedString(post.likes),
    quote: asTrimmedString(post.quote),
    author: normalizeCommunityAuthor(post.author, fallbackAuthor, type),
  };
}

export function normalizeCommunityPosts(posts) {
  const seed = buildCommunitySectionDefaults().posts;
  if (!Array.isArray(posts) || !posts.length) {
    return seed.map((item, index) => normalizeCommunityPost(item, index)).filter(Boolean);
  }
  return posts
    .map((post, index) => normalizeCommunityPost(post, index))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

export function normalizeCommunitySection(section) {
  const defaults = buildCommunitySectionDefaults();
  if (!section || typeof section !== "object") {
    return {
      ...defaults,
      instagram: { ...defaults.instagram },
      posts: normalizeCommunityPosts([]),
    };
  }
  const ig = section.instagram && typeof section.instagram === "object" ? section.instagram : {};
  const handle = asTrimmedString(ig.handle, defaults.instagram.handle);
  const displayHandle = asTrimmedString(
    ig.displayHandle,
    handle.startsWith("@") ? handle : `@${handle}`
  );
  const url =
    asTrimmedString(ig.url) || `https://instagram.com/${handle.replace(/^@/, "")}`;
  return {
    enabled: section.enabled !== false,
    eyebrow: asTrimmedString(section.eyebrow, defaults.eyebrow),
    title: asTrimmedString(section.title, defaults.title),
    subtitle: asTrimmedString(section.subtitle, defaults.subtitle),
    instagram: {
      handle,
      displayHandle,
      followersLabel: asTrimmedString(ig.followersLabel, defaults.instagram.followersLabel),
      followLabel: asTrimmedString(ig.followLabel, defaults.instagram.followLabel),
      url,
    },
    posts: normalizeCommunityPosts(section.posts),
  };
}

/** Merge admin config with bundled image fallbacks for the web home rail. */
export function resolveCommunityDisplay(section) {
  const normalized = normalizeCommunitySection(section);
  if (!normalized.enabled) return null;
  const posts = normalized.posts
    .filter((post) => post.enabled && (post.imageUrl || getCommunityPostImageFallback(post.id)))
    .map((post, index) => ({
      id: post.id,
      type: post.type,
      tag: post.tag,
      image: post.imageUrl || getCommunityPostImageFallback(post.id, index),
      views: post.views,
      likes: post.likes,
      quote: post.quote,
      author: post.author,
    }));
  if (!posts.length) return null;
  return {
    eyebrow: normalized.eyebrow,
    title: normalized.title,
    subtitle: normalized.subtitle,
    instagram: normalized.instagram,
    posts,
  };
}

export function normalizeCompareRow(row, index = 0) {
  if (!row || typeof row !== "object") return null;
  const id = asTrimmedString(row.id) || `compare-${index + 1}`;
  return {
    id,
    order: Number.isFinite(Number(row.order)) ? Number(row.order) : index,
    enabled: row.enabled !== false,
    label: asTrimmedString(row.label),
    ours: asTrimmedString(row.ours),
    ordinary: asTrimmedString(row.ordinary),
    oursImageUrl: asTrimmedString(row.oursImageUrl),
    ordinaryImageUrl: asTrimmedString(row.ordinaryImageUrl),
  };
}

export function normalizeCompareRows(rows) {
  const seed = buildCompareSectionDefaults().rows;
  if (!Array.isArray(rows) || !rows.length) {
    return seed.map((item, index) => normalizeCompareRow(item, index)).filter(Boolean);
  }
  return rows
    .map((row, index) => normalizeCompareRow(row, index))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

export function normalizeCompareSection(section) {
  const defaults = buildCompareSectionDefaults();
  if (!section || typeof section !== "object") {
    return { ...defaults, rows: normalizeCompareRows([]) };
  }
  return {
    enabled: section.enabled !== false,
    eyebrow: asTrimmedString(section.eyebrow, defaults.eyebrow),
    title: asTrimmedString(section.title, defaults.title),
    subtitle: asTrimmedString(section.subtitle, defaults.subtitle),
    filmLabel: asTrimmedString(section.filmLabel, defaults.filmLabel),
    storyChapter: asTrimmedString(section.storyChapter, defaults.storyChapter),
    openingLine: asTrimmedString(section.openingLine, defaults.openingLine),
    closingTagline: asTrimmedString(section.closingTagline, defaults.closingTagline),
    oursLabel: asTrimmedString(section.oursLabel, defaults.oursLabel),
    ordinaryLabel: asTrimmedString(section.ordinaryLabel, defaults.ordinaryLabel),
    rows: normalizeCompareRows(section.rows),
  };
}

function normalizeImageFit(value) {
  const fit = asTrimmedString(value).toLowerCase();
  return fit === "contain" ? "contain" : "cover";
}

export function normalizeProcessStep(step, index = 0) {
  if (!step || typeof step !== "object") return null;
  const id = asTrimmedString(step.id) || `process-${String(index + 1).padStart(2, "0")}`;
  return {
    id,
    order: Number.isFinite(Number(step.order)) ? Number(step.order) : index,
    enabled: step.enabled !== false,
    title: asTrimmedString(step.title),
    description: asTrimmedString(step.description),
    imageUrl: asTrimmedString(step.imageUrl),
    imageFit: normalizeImageFit(step.imageFit),
    imagePosition: asTrimmedString(step.imagePosition, "top center"),
  };
}

export function normalizeProcessSteps(steps) {
  const seed = buildProcessSectionDefaults().steps;
  if (!Array.isArray(steps) || !steps.length) {
    return seed.map((item, index) => normalizeProcessStep(item, index)).filter(Boolean);
  }
  return steps
    .map((step, index) => normalizeProcessStep(step, index))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

export function normalizeProcessSection(section) {
  const defaults = buildProcessSectionDefaults();
  if (!section || typeof section !== "object") {
    return { ...defaults, steps: normalizeProcessSteps([]) };
  }
  return {
    enabled: section.enabled !== false,
    eyebrow: asTrimmedString(section.eyebrow, defaults.eyebrow),
    title: asTrimmedString(section.title, defaults.title),
    subtitle: asTrimmedString(section.subtitle, defaults.subtitle),
    journeyLabel: asTrimmedString(section.journeyLabel, defaults.journeyLabel),
    filmLabel: asTrimmedString(section.filmLabel, defaults.filmLabel),
    openingLine: asTrimmedString(section.openingLine, defaults.openingLine),
    steps: normalizeProcessSteps(section.steps),
  };
}

/** Merge admin process config with bundled marketing fallbacks. */
export function resolveProcessDisplay(section) {
  const normalized = normalizeProcessSection(section);
  if (!normalized.enabled) return null;
  const steps = normalized.steps
    .filter((step) => step.enabled && step.title)
    .map((step, index) => ({
      id: step.id,
      step: index + 1,
      title: step.title,
      description: step.description,
      image: step.imageUrl || getProcessStepImageFallback(step.id),
      imageFit: step.imageFit,
      imagePosition: step.imagePosition,
    }));
  if (!steps.length) return null;
  return {
    eyebrow: normalized.eyebrow,
    title: normalized.title,
    subtitle: normalized.subtitle,
    journeyLabel: normalized.journeyLabel,
    filmLabel: normalized.filmLabel,
    openingLine: normalized.openingLine,
    steps,
  };
}

/** Merge admin compare config with bundled marketing fallbacks. */
export function resolveCompareDisplay(section) {
  const normalized = normalizeCompareSection(section);
  if (!normalized.enabled) return null;
  const rows = normalized.rows
    .filter((row) => row.enabled && row.label)
    .map((row) => ({
      id: row.id,
      label: row.label,
      ours: row.ours,
      ordinary: row.ordinary,
      oursImage: row.oursImageUrl || getCompareRowImageFallback(row.id, "ours"),
      ordinaryImage: row.ordinaryImageUrl || getCompareRowImageFallback(row.id, "ordinary"),
    }));
  if (!rows.length) return null;
  return {
    eyebrow: normalized.eyebrow,
    title: normalized.title,
    subtitle: normalized.subtitle,
    filmLabel: normalized.filmLabel,
    storyChapter: normalized.storyChapter,
    openingLine: normalized.openingLine,
    closingTagline: normalized.closingTagline,
    oursLabel: normalized.oursLabel,
    ordinaryLabel: normalized.ordinaryLabel,
    rows,
  };
}

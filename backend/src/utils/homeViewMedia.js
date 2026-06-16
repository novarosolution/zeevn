function asTrimmedString(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function normalizeMediaType(value) {
  const t = asTrimmedString(value).toLowerCase();
  return t === "video" ? "video" : "image";
}

/** @param {unknown} slide */
function normalizeHeroSlide(slide, index = 0) {
  if (!slide || typeof slide !== "object") return null;
  const url = asTrimmedString(slide.url);
  if (!url) return null;
  const id = asTrimmedString(slide.id) || `slide-${index + 1}`;
  return {
    id,
    order: Number.isFinite(Number(slide.order)) ? Number(slide.order) : index,
    mediaType: normalizeMediaType(slide.mediaType),
    url,
    title: asTrimmedString(slide.title),
    subtitle: asTrimmedString(slide.subtitle),
    enabled: slide.enabled !== false,
  };
}

/** @param {unknown} slides */
function normalizeHeroSlides(slides) {
  if (!Array.isArray(slides)) return [];
  return slides
    .map((slide, index) => normalizeHeroSlide(slide, index))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

/** @param {unknown} photo */
function normalizeAboutPhoto(photo) {
  if (!photo || typeof photo !== "object") return null;
  const url = asTrimmedString(photo.url);
  if (!url) return null;
  return {
    url,
    caption: asTrimmedString(photo.caption),
  };
}

const { buildAboutPageExtrasDefaults } = require("./aboutDefaults");

const ABOUT_DEFAULTS = {
  enabled: true,
  eyebrow: "Our story",
  title: "Craft rooted in tradition",
  body:
    "Zeevan crafts pure A2 Kankrej cow ghee using the ancestral Bilona method — hand-churned, wood-fired, and bottled in small batches for families who value tradition and taste.",
  videoUrl: "",
  videoCaption: "From grass-fed Kankrej cows to golden, grainy ghee.",
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

/** @param {unknown} about */
function normalizeAboutSection(about) {
  const extras = buildAboutPageExtrasDefaults();
  if (!about || typeof about !== "object") {
    return { ...ABOUT_DEFAULTS, ...extras, photos: [] };
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
    eyebrow: asTrimmedString(about.eyebrow, ABOUT_DEFAULTS.eyebrow),
    title: asTrimmedString(about.title, ABOUT_DEFAULTS.title),
    body: asTrimmedString(about.body, ABOUT_DEFAULTS.body),
    videoUrl: asTrimmedString(about.videoUrl),
    videoCaption: asTrimmedString(about.videoCaption, ABOUT_DEFAULTS.videoCaption),
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

const { COMMUNITY_SECTION_DEFAULTS } = require("./communityDefaults");

function normalizePostType(value) {
  const t = asTrimmedString(value).toLowerCase();
  return t === "customer" ? "customer" : "reel";
}

/** @param {unknown} author */
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

/** @param {unknown} post */
function normalizeCommunityPost(post, index = 0) {
  if (!post || typeof post !== "object") return null;
  const id = asTrimmedString(post.id) || `community-${index + 1}`;
  const type = normalizePostType(post.type);
  const fallbackAuthor =
    type === "customer"
      ? { name: "", subtitle: "", avatar: "C", brand: false }
      : { name: "zeevan", subtitle: "", avatar: "K", brand: true };
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

/** @param {unknown} posts */
function normalizeCommunityPosts(posts) {
  if (!Array.isArray(posts) || !posts.length) {
    return COMMUNITY_SECTION_DEFAULTS.posts.map((item, index) =>
      normalizeCommunityPost(item, index)
    );
  }
  return posts
    .map((post, index) => normalizeCommunityPost(post, index))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

/** @param {unknown} section */
function normalizeCommunitySection(section) {
  if (!section || typeof section !== "object") {
    return {
      ...COMMUNITY_SECTION_DEFAULTS,
      instagram: { ...COMMUNITY_SECTION_DEFAULTS.instagram },
      posts: normalizeCommunityPosts([]),
    };
  }
  const ig = section.instagram && typeof section.instagram === "object" ? section.instagram : {};
  const handle = asTrimmedString(ig.handle, COMMUNITY_SECTION_DEFAULTS.instagram.handle);
  const displayHandle = asTrimmedString(
    ig.displayHandle,
    handle.startsWith("@") ? handle : `@${handle}`
  );
  const url =
    asTrimmedString(ig.url) ||
    `https://instagram.com/${handle.replace(/^@/, "")}`;
  return {
    enabled: section.enabled !== false,
    eyebrow: asTrimmedString(section.eyebrow, COMMUNITY_SECTION_DEFAULTS.eyebrow),
    title: asTrimmedString(section.title, COMMUNITY_SECTION_DEFAULTS.title),
    instagram: {
      handle,
      displayHandle,
      followersLabel: asTrimmedString(
        ig.followersLabel,
        COMMUNITY_SECTION_DEFAULTS.instagram.followersLabel
      ),
      followLabel: asTrimmedString(
        ig.followLabel,
        COMMUNITY_SECTION_DEFAULTS.instagram.followLabel
      ),
      url,
    },
    posts: normalizeCommunityPosts(section.posts),
  };
}

const { COMPARE_SECTION_DEFAULTS } = require("./compareDefaults");
const { PROCESS_SECTION_DEFAULTS } = require("./processDefaults");

function normalizeImageFit(value) {
  const fit = asTrimmedString(value).toLowerCase();
  return fit === "contain" ? "contain" : "cover";
}

/** @param {unknown} step */
function normalizeProcessStep(step, index = 0) {
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

/** @param {unknown} steps */
function normalizeProcessSteps(steps) {
  if (!Array.isArray(steps) || !steps.length) {
    return PROCESS_SECTION_DEFAULTS.steps.map((item, index) => normalizeProcessStep(item, index));
  }
  return steps
    .map((step, index) => normalizeProcessStep(step, index))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

/** @param {unknown} section */
function normalizeProcessSection(section) {
  if (!section || typeof section !== "object") {
    return {
      ...PROCESS_SECTION_DEFAULTS,
      steps: normalizeProcessSteps([]),
    };
  }
  return {
    enabled: section.enabled !== false,
    eyebrow: asTrimmedString(section.eyebrow, PROCESS_SECTION_DEFAULTS.eyebrow),
    title: asTrimmedString(section.title, PROCESS_SECTION_DEFAULTS.title),
    subtitle: asTrimmedString(section.subtitle, PROCESS_SECTION_DEFAULTS.subtitle),
    journeyLabel: asTrimmedString(section.journeyLabel, PROCESS_SECTION_DEFAULTS.journeyLabel),
    filmLabel: asTrimmedString(section.filmLabel, PROCESS_SECTION_DEFAULTS.filmLabel),
    openingLine: asTrimmedString(section.openingLine, PROCESS_SECTION_DEFAULTS.openingLine),
    steps: normalizeProcessSteps(section.steps),
  };
}

/** @param {unknown} row */
function normalizeCompareRow(row, index = 0) {
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

/** @param {unknown} rows */
function normalizeCompareRows(rows) {
  if (!Array.isArray(rows) || !rows.length) {
    return COMPARE_SECTION_DEFAULTS.rows.map((item, index) => normalizeCompareRow(item, index));
  }
  return rows
    .map((row, index) => normalizeCompareRow(row, index))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

/** @param {unknown} section */
function normalizeCompareSection(section) {
  if (!section || typeof section !== "object") {
    return {
      ...COMPARE_SECTION_DEFAULTS,
      rows: normalizeCompareRows([]),
    };
  }
  return {
    enabled: section.enabled !== false,
    eyebrow: asTrimmedString(section.eyebrow, COMPARE_SECTION_DEFAULTS.eyebrow),
    title: asTrimmedString(section.title, COMPARE_SECTION_DEFAULTS.title),
    subtitle: asTrimmedString(section.subtitle, COMPARE_SECTION_DEFAULTS.subtitle),
    filmLabel: asTrimmedString(section.filmLabel, COMPARE_SECTION_DEFAULTS.filmLabel),
    storyChapter: asTrimmedString(section.storyChapter, COMPARE_SECTION_DEFAULTS.storyChapter),
    openingLine: asTrimmedString(section.openingLine, COMPARE_SECTION_DEFAULTS.openingLine),
    closingTagline: asTrimmedString(section.closingTagline, COMPARE_SECTION_DEFAULTS.closingTagline),
    oursLabel: asTrimmedString(section.oursLabel, COMPARE_SECTION_DEFAULTS.oursLabel),
    ordinaryLabel: asTrimmedString(section.ordinaryLabel, COMPARE_SECTION_DEFAULTS.ordinaryLabel),
    rows: normalizeCompareRows(section.rows),
  };
}

module.exports = {
  ABOUT_DEFAULTS,
  COMMUNITY_SECTION_DEFAULTS,
  COMPARE_SECTION_DEFAULTS,
  PROCESS_SECTION_DEFAULTS,
  normalizeHeroSlides,
  normalizeAboutSection,
  normalizeCommunitySection,
  normalizeCommunityPosts,
  normalizeCompareSection,
  normalizeCompareRows,
  normalizeProcessSection,
  normalizeProcessSteps,
};

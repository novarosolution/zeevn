const Product = require("../models/Product");
const { getCloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

function sanitizeVariants(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => ({
      label: String(v?.label ?? "").trim(),
      price: Math.max(0, Number(v?.price) || 0),
      tag: String(v?.tag ?? "").trim(),
    }))
    .filter((v) => v.label && Number.isFinite(v.price));
}

function sanitizeTrustChips(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b) => ({
      icon: String(b?.icon ?? "checkmark-circle-outline").trim() || "checkmark-circle-outline",
      label: String(b?.label ?? "").trim(),
    }))
    .filter((b) => b.label);
}

function sanitizeNutrition(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      kick: "",
      title: "",
      tableHead: "",
      tableSub: "",
      rows: [],
      cardTitle: "",
      cardBody: "",
      cardTags: [],
      cardFooter: "",
    };
  }
  const rows = Array.isArray(raw.rows)
    ? raw.rows
        .map((r) => ({
          label: String(r?.label ?? "").trim(),
          value: String(r?.value ?? "").trim(),
        }))
        .filter((r) => r.label && r.value)
    : [];
  const cardTags = Array.isArray(raw.cardTags)
    ? raw.cardTags.map((t) => String(t ?? "").trim()).filter(Boolean)
    : [];
  return {
    kick: String(raw.kick ?? "").trim(),
    title: String(raw.title ?? "").trim(),
    tableHead: String(raw.tableHead ?? "").trim(),
    tableSub: String(raw.tableSub ?? "").trim(),
    rows,
    cardTitle: String(raw.cardTitle ?? "").trim(),
    cardBody: String(raw.cardBody ?? "").trim(),
    cardTags,
    cardFooter: String(raw.cardFooter ?? "").trim(),
  };
}

function sanitizeLabeledBlocks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b) => ({
      icon: String(b?.icon ?? "checkmark-circle-outline").trim() || "checkmark-circle-outline",
      title: String(b?.title ?? "").trim(),
      description: String(b?.description ?? "").trim(),
    }))
    .filter((b) => b.title || b.description);
}

function sanitizeStringArray(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => String(s ?? "").trim()).filter(Boolean);
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return Boolean(value);
}

async function getProducts(req, res, next) {
  try {
    const products = await Product.find({ isPublished: { $ne: false } }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, isPublished: { $ne: false } });
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const {
      name,
      price,
      image,
      images,
      description,
      category,
      homeSection,
      productType,
      showOnHome,
      isPublished,
      homeOrder,
      brand,
      sku,
      unit,
      eta,
      isSpecial,
      comingSoon,
      comingSoonNote,
      inStock,
      stockQty,
      mrp,
      ratingAverage,
      reviewCount,
      badgeText,
      lifestyleImage,
      variants,
      usps,
      processTitle,
      processSteps,
      highlightQuote,
      usageRituals,
      richProductPage,
      pageEyebrow,
      trustChips,
      highlights,
      deliveryTitle,
      deliveryBody,
      storyKick,
      storyTitle,
      storyLegend,
      reviewsKick,
      reviewsTitle,
      nutrition,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: "Name and price are required." });
    }

    const mrpNum = mrp !== undefined && mrp !== "" ? toNumber(mrp, 0) : undefined;
    const ratingNum =
      ratingAverage !== undefined && ratingAverage !== ""
        ? Math.min(5, Math.max(0, toNumber(ratingAverage, 0)))
        : 0;
    const reviewNum =
      reviewCount !== undefined && reviewCount !== "" ? Math.max(0, Math.floor(toNumber(reviewCount, 0))) : 0;
    const variantRows = sanitizeVariants(variants);

    const product = await Product.create({
      name,
      price: toNumber(price, 0),
      ...(mrpNum !== undefined && mrpNum > 0 ? { mrp: mrpNum } : {}),
      image: image || "",
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      description: description || "",
      category: category || "General",
      homeSection: homeSection || "Prime Products",
      productType: productType || category || "General",
      showOnHome: toBoolean(showOnHome, true),
      isPublished: toBoolean(isPublished, true),
      homeOrder: toNumber(homeOrder, 0),
      brand: brand || "",
      sku: sku || "",
      unit: unit || "1 pc",
      eta: eta || "10 MINS",
      isSpecial: toBoolean(isSpecial, false),
      comingSoon: toBoolean(comingSoon, false),
      comingSoonNote: String(comingSoonNote || "").trim(),
      inStock: toBoolean(inStock, true),
      stockQty: Math.max(0, toNumber(stockQty, 0)),
      ratingAverage: ratingNum,
      reviewCount: reviewNum,
      badgeText: String(badgeText || "").trim(),
      lifestyleImage: String(lifestyleImage || "").trim(),
      variants: variantRows,
      usps: sanitizeLabeledBlocks(usps),
      processTitle: String(processTitle || "").trim(),
      processSteps: sanitizeStringArray(processSteps),
      highlightQuote: String(highlightQuote || "").trim(),
      usageRituals: sanitizeLabeledBlocks(usageRituals),
      richProductPage: toBoolean(richProductPage, false),
      pageEyebrow: String(pageEyebrow || "").trim(),
      trustChips: sanitizeTrustChips(trustChips),
      highlights: sanitizeStringArray(highlights),
      deliveryTitle: String(deliveryTitle || "").trim(),
      deliveryBody: String(deliveryBody || "").trim(),
      storyKick: String(storyKick || "").trim(),
      storyTitle: String(storyTitle || "").trim(),
      storyLegend: String(storyLegend || "").trim(),
      reviewsKick: String(reviewsKick || "").trim(),
      reviewsTitle: String(reviewsTitle || "").trim(),
      nutrition: sanitizeNutrition(nutrition),
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const {
      name,
      price,
      image,
      images,
      description,
      category,
      homeSection,
      productType,
      showOnHome,
      isPublished,
      homeOrder,
      brand,
      sku,
      unit,
      eta,
      isSpecial,
      comingSoon,
      comingSoonNote,
      inStock,
      stockQty,
      mrp,
      ratingAverage,
      reviewCount,
      badgeText,
      lifestyleImage,
      variants,
      usps,
      processTitle,
      processSteps,
      highlightQuote,
      usageRituals,
      richProductPage,
      pageEyebrow,
      trustChips,
      highlights,
      deliveryTitle,
      deliveryBody,
      storyKick,
      storyTitle,
      storyLegend,
      reviewsKick,
      reviewsTitle,
      nutrition,
    } = req.body;
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = toNumber(price, product.price);
    if (mrp !== undefined) {
      const nextMrp = mrp === "" || mrp === null ? undefined : Math.max(0, toNumber(mrp, 0));
      product.mrp = nextMrp;
    }
    if (image !== undefined) product.image = image;
    if (images !== undefined) product.images = Array.isArray(images) ? images.filter(Boolean) : [];
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (homeSection !== undefined) product.homeSection = homeSection;
    if (productType !== undefined) product.productType = productType;
    if (showOnHome !== undefined) product.showOnHome = toBoolean(showOnHome, product.showOnHome);
    if (isPublished !== undefined) product.isPublished = toBoolean(isPublished, product.isPublished);
    if (homeOrder !== undefined) product.homeOrder = toNumber(homeOrder, product.homeOrder);
    if (brand !== undefined) product.brand = brand;
    if (sku !== undefined) product.sku = sku;
    if (unit !== undefined) product.unit = unit;
    if (eta !== undefined) product.eta = eta;
    if (isSpecial !== undefined) product.isSpecial = toBoolean(isSpecial, product.isSpecial);
    if (comingSoon !== undefined) product.comingSoon = toBoolean(comingSoon, product.comingSoon);
    if (comingSoonNote !== undefined) product.comingSoonNote = String(comingSoonNote || "").trim();
    if (inStock !== undefined) product.inStock = toBoolean(inStock, product.inStock);
    if (stockQty !== undefined) product.stockQty = Math.max(0, toNumber(stockQty, product.stockQty));
    if (ratingAverage !== undefined) {
      product.ratingAverage = Math.min(5, Math.max(0, toNumber(ratingAverage, product.ratingAverage)));
    }
    if (reviewCount !== undefined) {
      product.reviewCount = Math.max(0, Math.floor(toNumber(reviewCount, product.reviewCount)));
    }
    if (badgeText !== undefined) product.badgeText = String(badgeText || "").trim();
    if (lifestyleImage !== undefined) product.lifestyleImage = String(lifestyleImage || "").trim();
    if (variants !== undefined) product.variants = sanitizeVariants(variants);
    if (usps !== undefined) product.usps = sanitizeLabeledBlocks(usps);
    if (processTitle !== undefined) product.processTitle = String(processTitle || "").trim();
    if (processSteps !== undefined) product.processSteps = sanitizeStringArray(processSteps);
    if (highlightQuote !== undefined) product.highlightQuote = String(highlightQuote || "").trim();
    if (usageRituals !== undefined) product.usageRituals = sanitizeLabeledBlocks(usageRituals);
    if (richProductPage !== undefined) product.richProductPage = toBoolean(richProductPage, product.richProductPage);
    if (pageEyebrow !== undefined) product.pageEyebrow = String(pageEyebrow || "").trim();
    if (trustChips !== undefined) product.trustChips = sanitizeTrustChips(trustChips);
    if (highlights !== undefined) product.highlights = sanitizeStringArray(highlights);
    if (deliveryTitle !== undefined) product.deliveryTitle = String(deliveryTitle || "").trim();
    if (deliveryBody !== undefined) product.deliveryBody = String(deliveryBody || "").trim();
    if (storyKick !== undefined) product.storyKick = String(storyKick || "").trim();
    if (storyTitle !== undefined) product.storyTitle = String(storyTitle || "").trim();
    if (storyLegend !== undefined) product.storyLegend = String(storyLegend || "").trim();
    if (reviewsKick !== undefined) product.reviewsKick = String(reviewsKick || "").trim();
    if (reviewsTitle !== undefined) product.reviewsTitle = String(reviewsTitle || "").trim();
    if (nutrition !== undefined) product.nutrition = sanitizeNutrition(nutrition);

    await product.save();
    res.json(product);
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully." });
  } catch (error) {
    next(error);
  }
}

async function uploadProductImage(req, res, next) {
  try {
    const { imageBase64, mimeType } = req.body || {};

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ message: "imageBase64 is required." });
    }

    const hasDataPrefix = imageBase64.startsWith("data:image/");
    const safeMime = typeof mimeType === "string" && mimeType.startsWith("image/")
      ? mimeType
      : "image/jpeg";
    const uploadSource = hasDataPrefix
      ? imageBase64
      : `data:${safeMime};base64,${imageBase64}`;

    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        message: "Image upload is not configured on this server.",
      });
    }

    const cloudinary = getCloudinary();
    const uploaded = await cloudinary.uploader.upload(uploadSource, {
      folder: "kankreg/products",
      resource_type: "image",
      transformation: [{ quality: "auto:good", fetch_format: "auto", width: 1600, crop: "limit" }],
    });

    res.status(201).json({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    });
  } catch (error) {
    if (error?.http_code === 413 || String(error?.message || "").toLowerCase().includes("file size")) {
      return res.status(413).json({
        message: "Image is too large. Please choose a smaller photo.",
      });
    }
    next(error);
  }
}

async function uploadMarketingVideo(req, res, next) {
  try {
    const { videoBase64, mimeType } = req.body || {};

    if (!videoBase64 || typeof videoBase64 !== "string") {
      return res.status(400).json({ message: "videoBase64 is required." });
    }

    const hasDataPrefix = videoBase64.startsWith("data:video/");
    const safeMime =
      typeof mimeType === "string" && mimeType.startsWith("video/") ? mimeType : "video/mp4";
    const uploadSource = hasDataPrefix ? videoBase64 : `data:${safeMime};base64,${videoBase64}`;

    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        message: "Video upload is not configured on this server.",
      });
    }

    const cloudinary = getCloudinary();
    const uploaded = await cloudinary.uploader.upload(uploadSource, {
      folder: "kankreg/marketing",
      resource_type: "video",
      transformation: [{ width: 1280, crop: "limit", quality: "auto:good" }],
    });

    res.status(201).json({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    });
  } catch (error) {
    if (error?.http_code === 413 || String(error?.message || "").toLowerCase().includes("file size")) {
      return res.status(413).json({
        message: "Video is too large. Please choose a shorter clip or smaller file.",
      });
    }
    next(error);
  }
}

async function getProductReviews(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).select("name ratingAverage reviewCount reviews");
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    const reviews = [...(product.reviews || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({
      productId: product._id,
      productName: product.name,
      ratingAverage: Number(product.ratingAverage || 0),
      reviewCount: Number(product.reviewCount || 0),
      reviews,
    });
  } catch (error) {
    next(error);
  }
}

async function createOrUpdateProductReview(req, res, next) {
  try {
    const { id } = req.params;
    const ratingNum = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim();
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const userId = String(req.user._id);
    const existing = (product.reviews || []).find((r) => String(r.user) === userId);
    if (existing) {
      existing.rating = ratingNum;
      existing.comment = comment;
      existing.userName = String(req.user.name || "User").trim() || "User";
    } else {
      product.reviews.push({
        user: req.user._id,
        userName: String(req.user.name || "User").trim() || "User",
        rating: ratingNum,
        comment,
      });
    }

    const all = product.reviews || [];
    const reviewCount = all.length;
    const sum = all.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    product.reviewCount = reviewCount;
    product.ratingAverage = reviewCount > 0 ? Number((sum / reviewCount).toFixed(2)) : 0;
    await product.save();

    const reviews = [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.status(201).json({
      productId: product._id,
      ratingAverage: product.ratingAverage,
      reviewCount: product.reviewCount,
      reviews,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  uploadMarketingVideo,
  getProductReviews,
  createOrUpdateProductReview,
};

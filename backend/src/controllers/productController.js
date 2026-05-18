const Product = require("../models/Product");
const Order = require("../models/Order");
const { getCloudinary, isCloudinaryConfigured } = require("../config/cloudinary");
const CLOUDINARY_PRODUCT_FOLDER =
  String(process.env.CLOUDINARY_PRODUCT_FOLDER || process.env.CLOUDINARY_UPLOAD_PREFIX || "").trim() ||
  "zeevan/products";

function sanitizeVariants(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => ({
      label: String(v?.label ?? "").trim(),
      price: Math.max(0, Number(v?.price) || 0),
    }))
    .filter((v) => v.label && Number.isFinite(v.price));
}

function sanitizeLabeledBlocks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((b) => ({
      icon: String(b?.icon ?? "checkmark-circle-outline").trim() || "checkmark-circle-outline",
      title: String(b?.title ?? "").trim(),
      description: String(b?.description ?? "").trim(),
      image: String(b?.image ?? "").trim(),
      recipeUrl: String(b?.recipeUrl ?? b?.recipeLink ?? "").trim(),
    }))
    .filter((b) => b.title || b.description);
}

function sanitizeSourcing(raw) {
  if (!raw || typeof raw !== "object") return undefined;
  const originRegion = String(raw.originRegion ?? "").trim();
  const harvestDate = String(raw.harvestDate ?? "").trim();
  const certifications = Array.isArray(raw.certifications)
    ? raw.certifications.map((c) => String(c ?? "").trim()).filter(Boolean)
    : [];
  if (!originRegion && !harvestDate && !certifications.length) return undefined;
  return { originRegion, harvestDate, certifications };
}

function sanitizeStringArray(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => String(s ?? "").trim()).filter(Boolean);
}

function sanitizeMedia(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => ({
      type: String(m?.type ?? "image").toLowerCase() === "video" ? "video" : "image",
      url: String(m?.url ?? "").trim(),
      poster: String(m?.poster ?? "").trim(),
    }))
    .filter((m) => m.url);
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
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json(product);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Product not found" });
    }
    return next(error);
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
      homeOrder,
      brand,
      sku,
      unit,
      eta,
      isSpecial,
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
      highlightQuoteAttribution,
      lifestyleCaption,
      processImage,
      usageRituals,
      richProductPage,
      media,
      sourcing,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: "Name and price are required." });
    }

    const mrpNum = mrp !== undefined && mrp !== "" ? toNumber(mrp, 0) : undefined;
    const sourcingRow = sanitizeSourcing(sourcing);
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
      homeOrder: toNumber(homeOrder, 0),
      brand: brand || "",
      sku: sku || "",
      unit: unit || "1 pc",
      eta: eta || "10 MINS",
      isSpecial: toBoolean(isSpecial, false),
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
      highlightQuoteAttribution: String(highlightQuoteAttribution || "").trim(),
      lifestyleCaption: String(lifestyleCaption || "").trim(),
      processImage: String(processImage || "").trim(),
      usageRituals: sanitizeLabeledBlocks(usageRituals),
      richProductPage: toBoolean(richProductPage, false),
      media: sanitizeMedia(media),
      ...(sourcingRow ? { sourcing: sourcingRow } : {}),
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
      homeOrder,
      brand,
      sku,
      unit,
      eta,
      isSpecial,
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
      highlightQuoteAttribution,
      lifestyleCaption,
      processImage,
      usageRituals,
      richProductPage,
      media,
      sourcing,
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
    if (homeOrder !== undefined) product.homeOrder = toNumber(homeOrder, product.homeOrder);
    if (brand !== undefined) product.brand = brand;
    if (sku !== undefined) product.sku = sku;
    if (unit !== undefined) product.unit = unit;
    if (eta !== undefined) product.eta = eta;
    if (isSpecial !== undefined) product.isSpecial = toBoolean(isSpecial, product.isSpecial);
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
    if (highlightQuoteAttribution !== undefined) {
      product.highlightQuoteAttribution = String(highlightQuoteAttribution || "").trim();
    }
    if (lifestyleCaption !== undefined) product.lifestyleCaption = String(lifestyleCaption || "").trim();
    if (processImage !== undefined) product.processImage = String(processImage || "").trim();
    if (usageRituals !== undefined) product.usageRituals = sanitizeLabeledBlocks(usageRituals);
    if (sourcing !== undefined) {
      const next = sanitizeSourcing(sourcing);
      product.sourcing = next || { originRegion: "", harvestDate: "", certifications: [] };
    }
    if (richProductPage !== undefined) product.richProductPage = toBoolean(richProductPage, product.richProductPage);
    if (media !== undefined) product.media = sanitizeMedia(media);

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
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        error: "image_uploads_disabled",
        message: "Image uploads are not configured in this environment.",
      });
    }
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

    const uploaded = await getCloudinary().uploader.upload(uploadSource, {
      folder: CLOUDINARY_PRODUCT_FOLDER,
      resource_type: "image",
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

async function userHasVerifiedPurchase(userId, productId) {
  const delivered = await Order.exists({
    user: userId,
    status: { $in: ["delivered", "shipped", "paid"] },
    "products.product": productId,
  });
  return Boolean(delivered);
}

function sanitizeReviewPhotos(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((u) => String(u || "").trim()).filter(Boolean).slice(0, 4);
}

async function createOrUpdateProductReview(req, res, next) {
  try {
    const { id } = req.params;
    const ratingNum = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim();
    const title = String(req.body?.title || "").trim().slice(0, 80);
    const photos = sanitizeReviewPhotos(req.body?.photos);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const userId = String(req.user._id);
    const verifiedPurchase = await userHasVerifiedPurchase(req.user._id, product._id);
    const existing = (product.reviews || []).find((r) => String(r.user) === userId);
    if (existing) {
      existing.rating = ratingNum;
      existing.comment = comment;
      existing.title = title;
      existing.photos = photos;
      existing.userName = String(req.user.name || "User").trim() || "User";
      existing.verifiedPurchase = verifiedPurchase || existing.verifiedPurchase;
    } else {
      product.reviews.push({
        user: req.user._id,
        userName: String(req.user.name || "User").trim() || "User",
        rating: ratingNum,
        comment,
        title,
        photos,
        verifiedPurchase,
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

async function uploadReviewPhoto(req, res, next) {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        error: "image_uploads_disabled",
        message: "Image uploads are not configured in this environment.",
      });
    }
    const { id } = req.params;
    const product = await Product.findById(id).select("_id");
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ message: "imageBase64 is required." });
    }

    const hasDataPrefix = imageBase64.startsWith("data:image/");
    const safeMime = typeof mimeType === "string" && mimeType.startsWith("image/") ? mimeType : "image/jpeg";
    const uploadSource = hasDataPrefix ? imageBase64 : `data:${safeMime};base64,${imageBase64}`;
    const folder = `${CLOUDINARY_PRODUCT_FOLDER}/reviews`;

    const uploaded = await getCloudinary().uploader.upload(uploadSource, {
      folder,
      resource_type: "image",
    });

    res.status(201).json({ url: uploaded.secure_url, publicId: uploaded.public_id });
  } catch (error) {
    if (error?.http_code === 413 || String(error?.message || "").toLowerCase().includes("file size")) {
      return res.status(413).json({ message: "Image is too large. Please choose a smaller photo." });
    }
    next(error);
  }
}

async function voteProductReview(req, res, next) {
  try {
    const { id, reviewId } = req.params;
    const helpful = req.body?.helpful !== false;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const review = (product.reviews || []).find((r) => String(r._id) === String(reviewId));
    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    if (helpful) {
      review.helpfulCount = Math.max(0, Number(review.helpfulCount || 0) + 1);
    } else {
      review.notHelpfulCount = Math.max(0, Number(review.notHelpfulCount || 0) + 1);
    }
    await product.save();

    res.json({
      reviewId: String(review._id),
      helpfulCount: Number(review.helpfulCount || 0),
      notHelpfulCount: Number(review.notHelpfulCount || 0),
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
  getProductReviews,
  createOrUpdateProductReview,
  uploadReviewPhoto,
  voteProductReview,
};

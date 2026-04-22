const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");

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
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
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
      usageRituals,
      richProductPage,
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
      usageRituals: sanitizeLabeledBlocks(usageRituals),
      richProductPage: toBoolean(richProductPage, false),
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
      usageRituals,
      richProductPage,
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
    if (usageRituals !== undefined) product.usageRituals = sanitizeLabeledBlocks(usageRituals);
    if (richProductPage !== undefined) product.richProductPage = toBoolean(richProductPage, product.richProductPage);

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

    const uploaded = await cloudinary.uploader.upload(uploadSource, {
      folder: "kankreg/products",
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

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
};

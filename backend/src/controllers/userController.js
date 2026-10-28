const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { resolveProductLineFromRaw } = require("../utils/productLine");
const { getCloudinary, isCloudinaryConfigured } = require("../config/cloudinary");
const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");
const generateTokenModule = require("../utils/generateToken");

const generateToken = generateTokenModule;
const generateRefreshToken =
  generateTokenModule.generateRefreshToken || generateTokenModule;
const verifyRefreshToken = generateTokenModule.verifyRefreshToken;
const { verifyGoogleIdToken, verifyAppleIdentityToken } = require("../services/oauthService");
const { latestForUser, deletionPublic } = require("./deletionController");
const { recordAdminAction } = require("../utils/adminLog");

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function bootstrapAdminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function hasProvider(user, provider, providerId) {
  return (user.authProviders || []).some(
    (p) => p.provider === provider && p.providerId === providerId
  );
}

async function findOrCreateOAuthUser(profile) {
  const { provider, providerId, name, avatar } = profile;
  const email = normalizeEmail(profile.email);
  // Only an email the provider has verified may link to an existing account or earn the bootstrap admin role.
  const verifiedEmail = Boolean(profile.emailVerified) && Boolean(email);
  const matchers = [{ authProviders: { $elemMatch: { provider, providerId } } }];
  if (verifiedEmail) matchers.push({ email });
  let user = await User.findOne({ $or: matchers });

  if (user) {
    if (!hasProvider(user, provider, providerId)) {
      user.authProviders = [...(user.authProviders || []), { provider, providerId }];
    }
    if (avatar && !user.avatar) user.avatar = avatar;
    if (name && (!user.name || user.name === user.email)) user.name = name;
    if (verifiedEmail && bootstrapAdminEmails().includes(normalizeEmail(user.email))) {
      user.isAdmin = true;
    }
    await user.save();
    return user;
  }

  const userCount = await User.countDocuments();
  user = await User.create({
    name: name || email.split("@")[0],
    email: normalizeEmail(email),
    password: "",
    avatar: avatar || "",
    isAdmin: userCount === 0 || (verifiedEmail && bootstrapAdminEmails().includes(email)),
    authProviders: [{ provider, providerId }],
  });
  return user;
}

function issueAuthResponse(user, res) {
  const token = generateToken(user._id, user.tokenVersion);
  const refreshToken = generateRefreshToken(user._id, user.tokenVersion);
  res.json({
    token,
    refreshToken,
    user: serializePublicUser(user),
  });
}

function serializePublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    defaultAddress: user.defaultAddress,
    isAdmin: user.isAdmin,
    isDeliveryPartner: Boolean(user.isDeliveryPartner),
    cartItems: user.cartItems || [],
    avatar: user.avatar || "",
    rewardPoints: Number(user.rewardPoints || 0),
  };
}

function dbReady(res) {
  if (mongoose.connection.readyState === 1) return true;
  res.status(503).json({ message: "Shop is busy. Try again in a moment.", code: "DB_DOWN" });
  return false;
}

async function registerUser(req, res, next) {
  try {
    if (!dbReady(res)) return;
    const { name, password, phone } = req.body;
    const email = normalizeEmail(req.body?.email);

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userCount = await User.countDocuments();
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      // Password sign-ups never self-promote by email: nobody has proven they own that address yet.
      isAdmin: userCount === 0,
    });

    const token = generateToken(user._id, user.tokenVersion);
    const refreshToken = generateRefreshToken(user._id, user.tokenVersion);

    res.status(201).json({
      token,
      refreshToken,
      user: serializePublicUser(user),
      message: "User registered successfully.",
    });
  } catch (error) {
    next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    if (!dbReady(res)) return;
    const email = normalizeEmail(req.body?.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.password) {
      return res.status(401).json({
        message: "This account uses Google or Apple sign-in. Use that method to continue.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken(user._id, user.tokenVersion);
    const refreshToken = generateRefreshToken(user._id, user.tokenVersion);

    res.json({
      token,
      refreshToken,
      user: serializePublicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

async function authGoogle(req, res, next) {
  try {
    if (!dbReady(res)) return;
    const profile = await verifyGoogleIdToken(req.body?.idToken);
    const user = await findOrCreateOAuthUser(profile);
    issueAuthResponse(user, res);
  } catch (error) {
    if (error.message && !error.statusCode) {
      return res.status(401).json({ message: error.message });
    }
    next(error);
  }
}

async function authApple(req, res, next) {
  try {
    if (!dbReady(res)) return;
    const profile = await verifyAppleIdentityToken(req.body?.identityToken);
    if (req.body?.fullName) {
      const parts = [req.body.fullName.givenName, req.body.fullName.familyName].filter(Boolean);
      if (parts.length) profile.name = parts.join(" ");
    }
    const user = await findOrCreateOAuthUser(profile);
    issueAuthResponse(user, res);
  } catch (error) {
    if (error.message && !error.statusCode) {
      return res.status(401).json({ message: error.message });
    }
    next(error);
  }
}

async function refreshAccessToken(req, res, next) {
  try {
    if (!dbReady(res)) return;
    const refreshToken = String(req.body?.refreshToken || "").trim();
    if (!refreshToken) {
      return res.status(400).json({ message: "refreshToken is required." });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired refresh token." });
    }

    if (decoded.type && decoded.type !== "refresh") {
      return res.status(401).json({ message: "Token is not a refresh token." });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user || user.deletedAt) {
      return res.status(401).json({ message: "User no longer exists." });
    }
    if (Number(decoded.v || 0) !== Number(user.tokenVersion || 0)) {
      return res.status(401).json({ message: "Session was signed out. Please log in again." });
    }

    const token = generateToken(user._id, user.tokenVersion);
    res.json({
      token,
      user: serializePublicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

/** Sign this account out everywhere: every access and refresh token issued so far stops working. */
async function logoutAllDevices(req, res, next) {
  try {
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    res.json({ message: "Signed out on all devices." });
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const payload = serializePublicUser(user);
    payload.deletion = deletionPublic(await latestForUser(user._id));
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { name, phone, defaultAddress, avatar } = req.body;
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) {
      user.avatar = typeof avatar === "string" ? avatar.trim() : "";
    }
    if (defaultAddress && typeof defaultAddress === "object") {
      const { cleanMapCoord } = require("../utils/shopLocation");
      user.defaultAddress = {
        ...user.defaultAddress,
        ...defaultAddress,
        latitude: cleanMapCoord(defaultAddress.latitude ?? user.defaultAddress?.latitude, 90),
        longitude: cleanMapCoord(defaultAddress.longitude ?? user.defaultAddress?.longitude),
      };
    }

    await user.save();
    res.json(serializePublicUser(user));
  } catch (error) {
    next(error);
  }
}

async function uploadUserAvatar(req, res, next) {
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
      folder: "kankreg/avatars",
      resource_type: "image",
    });

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.avatar = uploaded.secure_url;
    await user.save();

    res.json(serializePublicUser(user));
  } catch (error) {
    if (error?.http_code === 413 || String(error?.message || "").toLowerCase().includes("file size")) {
      return res.status(413).json({
        message: "Image is too large. Please choose a smaller photo.",
      });
    }
    next(error);
  }
}

async function upsertPushToken(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const pushToken = String(req.body?.pushToken || "").trim();
    if (!pushToken) {
      return res.status(400).json({ message: "pushToken is required." });
    }
    if (!pushToken.startsWith("ExponentPushToken[") && !pushToken.startsWith("ExpoPushToken[")) {
      return res.status(400).json({ message: "Invalid Expo push token." });
    }

    const existing = Array.isArray(user.expoPushTokens) ? user.expoPushTokens : [];
    const nextTokens = Array.from(new Set([...existing, pushToken])).slice(-5);
    user.expoPushTokens = nextTokens;
    await user.save();

    res.json({ message: "Push token saved.", tokenCount: user.expoPushTokens.length });
  } catch (error) {
    next(error);
  }
}

async function getMyCart(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("cartItems");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ items: user.cartItems || [] });
  } catch (error) {
    next(error);
  }
}

async function replaceMyCart(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const inputItems = (Array.isArray(req.body?.items) ? req.body.items : []).filter(
      (item) => item && typeof item === "object"
    );
    const objectIdItems = inputItems.filter((item) => mongoose.Types.ObjectId.isValid(item.product || item.id));
    const objectProductIds = objectIdItems.map((item) => item.product || item.id);
    const foundProducts = objectProductIds.length
      ? await Product.find({ _id: { $in: objectProductIds } })
      : [];
    const productMap = new Map(foundProducts.map((product) => [String(product._id), product]));

    // Only catalog jars live in a saved cart (priced by the catalog); anything else could never be ordered.
    const normalizedItems = [];
    for (const rawItem of inputItems) {
      const quantity = rawItem.quantity === undefined || rawItem.quantity === null ? 1 : Math.floor(Number(rawItem.quantity));
      if (!Number.isFinite(quantity) || quantity < 1) continue;

      const matched = productMap.get(String(rawItem.product || rawItem.id));
      if (!matched) continue;
      let line;
      try {
        line = resolveProductLineFromRaw(matched, rawItem);
      } catch {
        continue;
      }
      normalizedItems.push({
        product: matched._id,
        name: line.name,
        price: line.price,
        image: matched.image || "",
        quantity,
        ...(line.variantLabel ? { variantLabel: line.variantLabel } : {}),
      });
    }

    user.cartItems = normalizedItems;
    await user.save();
    res.json({ items: user.cartItems || [] });
  } catch (error) {
    next(error);
  }
}

const USER_LIST_SELECT = "name email phone isAdmin isDeliveryPartner walkIn adminNote createdAt defaultAddress";

async function attachOrderStats(users) {
  if (!users.length) return new Map();
  const rows = await Order.aggregate([
    { $match: { user: { $in: users.map((user) => user._id) } } },
    {
      $group: {
        _id: "$user",
        orderCount: {
          $sum: { $cond: [{ $in: ["$status", ["cancelled", "pending_payment"]] }, 0, 1] },
        },
        spent: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, "$totalPrice", 0] } },
        spentOnline: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ["$status", "delivered"] }, { $ne: ["$channel", "walk_in"] }] },
              "$totalPrice",
              0,
            ],
          },
        },
        spentWalkIn: {
          $sum: {
            $cond: [{ $and: [{ $eq: ["$status", "delivered"] }, { $eq: ["$channel", "walk_in"] }] }, "$totalPrice", 0],
          },
        },
        lastVisit: { $max: "$createdAt" },
      },
    },
  ]);
  return new Map(rows.map((row) => [String(row._id), row]));
}

function presentAdminUser(user, stats) {
  const row = {
    _id: user._id,
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    isAdmin: Boolean(user.isAdmin),
    isDeliveryPartner: Boolean(user.isDeliveryPartner),
    walkIn: Boolean(user.walkIn),
    adminNote: user.adminNote || "",
    createdAt: user.createdAt,
    defaultAddress: user.defaultAddress || null,
  };
  if (!row.isAdmin) {
    row.orderCount = stats?.orderCount || 0;
    row.spent = Math.round(Number(stats?.spent) || 0);
    row.spentOnline = Math.round(Number(stats?.spentOnline) || 0);
    row.spentWalkIn = Math.round(Number(stats?.spentWalkIn) || 0);
    row.lastVisit = stats?.lastVisit || null;
  }
  return row;
}

async function getAllUsers(req, res, next) {
  try {
    const filter = {};
    if (String(req.query.isAdmin) === "false") filter.isAdmin = false;
    else if (String(req.query.isAdmin) === "true") filter.isAdmin = true;
    const users = await User.find(filter).select(USER_LIST_SELECT).sort({ createdAt: -1 }).lean();
    const statsById = await attachOrderStats(users.filter((row) => !row.isAdmin));
    res.json(users.map((row) => presentAdminUser(row, statsById.get(String(row._id)))));
  } catch (error) {
    next(error);
  }
}

async function updateUserAdminStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;

    if (String(req.user?._id) === String(id) && !Boolean(isAdmin)) {
      return res.status(400).json({ message: "You can’t remove your own admin access." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const on = Boolean(isAdmin);
    const changed = user.isAdmin !== on;
    user.isAdmin = on;
    await user.save();
    if (changed) {
      await recordAdminAction(req, {
        action: on ? "Turned admin on" : "Turned admin off",
        subject: user.name || "User",
        tab: "people",
        href: { screen: "AdminUsers" },
      });
    }

    res.json({
      message: "User role updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isDeliveryPartner: Boolean(user.isDeliveryPartner),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateUserDeliveryPartnerStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isDeliveryPartner } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const on = Boolean(isDeliveryPartner);
    const changed = user.isDeliveryPartner !== on;
    user.isDeliveryPartner = on;
    await user.save();
    if (changed) {
      await recordAdminAction(req, {
        action: on ? "Turned rider on" : "Turned rider off",
        subject: user.name || "User",
        tab: "riders",
        href: { screen: "AdminUsers" },
      });
    }

    res.json({
      message: "Delivery partner flag updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isDeliveryPartner: Boolean(user.isDeliveryPartner),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (String(req.user._id) === String(id)) {
      return res.status(400).json({ message: "You cannot delete your own admin account." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await user.deleteOne();
    res.json({ message: "User deleted successfully." });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerUser,
  loginUser,
  authGoogle,
  authApple,
  refreshAccessToken,
  logoutAllDevices,
  getProfile,
  updateProfile,
  uploadUserAvatar,
  getAllUsers,
  updateUserAdminStatus,
  updateUserDeliveryPartnerStatus,
  deleteUser,
  upsertPushToken,
  getMyCart,
  replaceMyCart,
};

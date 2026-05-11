const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { resolveProductLineFromRaw } = require("../utils/productLine");
const cloudinary = require("../config/cloudinary");
const Product = require("../models/Product");
const User = require("../models/User");
const generateTokenModule = require("../utils/generateToken");

const generateToken = generateTokenModule;
const generateRefreshToken =
  generateTokenModule.generateRefreshToken || generateTokenModule;
const verifyRefreshToken = generateTokenModule.verifyRefreshToken;
const CLOUDINARY_AVATAR_FOLDER =
  String(process.env.CLOUDINARY_AVATAR_FOLDER || process.env.CLOUDINARY_UPLOAD_PREFIX || "").trim() ||
  "zeevan/avatars";

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

async function registerUser(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
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
      isAdmin: userCount === 0,
    });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      token,
      refreshToken,
      user: serializePublicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

async function refreshAccessToken(req, res, next) {
  try {
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
    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: serializePublicUser(user),
    });
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
    res.json(serializePublicUser(user));
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
      user.defaultAddress = {
        ...user.defaultAddress,
        ...defaultAddress,
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

    const uploaded = await cloudinary.uploader.upload(uploadSource, {
      folder: CLOUDINARY_AVATAR_FOLDER,
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

    const inputItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const objectIdItems = inputItems.filter((item) => mongoose.Types.ObjectId.isValid(item.product));
    const objectProductIds = objectIdItems.map((item) => item.product);
    const foundProducts = objectProductIds.length
      ? await Product.find({ _id: { $in: objectProductIds } })
      : [];
    const productMap = new Map(foundProducts.map((product) => [String(product._id), product]));

    const normalizedItems = [];
    for (const rawItem of inputItems) {
      const quantity = Number(rawItem.quantity || 1);
      if (!quantity || quantity < 1) continue;

      const hasObjectId = mongoose.Types.ObjectId.isValid(rawItem.product || rawItem.id);
      if (hasObjectId) {
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
      } else {
        const name = String(rawItem.name || "").trim();
        const price = Number(rawItem.price);
        if (!name || Number.isNaN(price) || price < 0) continue;
        normalizedItems.push({
          externalProductId: String(rawItem.product || rawItem.id || ""),
          name,
          price,
          image: String(rawItem.image || ""),
          quantity,
        });
      }
    }

    user.cartItems = normalizedItems;
    await user.save();
    res.json({ items: user.cartItems || [] });
  } catch (error) {
    next(error);
  }
}

async function getAllUsers(req, res, next) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
}

async function updateUserAdminStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.isAdmin = Boolean(isAdmin);
    await user.save();

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

    user.isDeliveryPartner = Boolean(isDeliveryPartner);
    await user.save();

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
  refreshAccessToken,
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

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { sendPasswordResetEmail } = require("../utils/sendPasswordResetEmail");
const { sendEmailVerificationEmail } = require("../utils/sendEmailVerification");
const {
  logAccountActivity,
  recordUserSession,
  touchSession,
} = require("../utils/accountSecurity");
const { resolveProductLineFromRaw } = require("../utils/productLine");
const { getCloudinary, isCloudinaryConfigured } = require("../config/cloudinary");
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
    emailVerified: Boolean(user.emailVerified),
    profileVersion: Number(user.profileVersion || 1),
    accountDeletionRequestedAt: user.accountDeletionRequestedAt || null,
  };
}

async function registerUser(req, res, next) {
  try {
    const { name, password, phone } = req.body;
    const email = normalizeEmailInput(req.body?.email);

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "An account already exists with this email." });
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

    const sessionId = await recordUserSession(user, req);
    logAccountActivity(user, "sign_in", "Registration");
    await user.save();

    const token = generateToken(user._id, sessionId);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      token,
      refreshToken,
      sessionId,
      user: serializePublicUser(user),
      requiresEmailVerification: false,
      message: "User registered successfully.",
    });
  } catch (error) {
    next(error);
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmailInput(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

/** Always 200 for valid email — sends reset mail only when an account exists. */
async function requestPasswordReset(req, res, next) {
  try {
    const email = normalizeEmailInput(req.body?.email);
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpires");
    let devLink;
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      user.passwordResetToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
      await user.save();
      try {
        const delivery = await sendPasswordResetEmail(user.email, rawToken);
        if (process.env.NODE_ENV !== "production" && delivery?.link && !delivery?.sent) {
          devLink = delivery.link;
        }
      } catch {
        // Swallow — response must not reveal delivery failures.
      }
    }

    res.status(200).json({
      message: "If an account exists for that email, reset instructions have been sent.",
      ...(devLink ? { devLink } : {}),
    });
  } catch (error) {
    next(error);
  }
}

/** Complete password reset from email link token. */
async function resetPasswordWithToken(req, res, next) {
  try {
    const email = normalizeEmailInput(req.body?.email);
    const token = String(req.body?.token || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (!token) {
      return res.status(400).json({ message: "Reset token is required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpires +password");
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link." });
    }
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    if (user.passwordResetToken !== hash || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired reset link." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    logAccountActivity(user, "password_change", "Password reset via email link");
    await user.save();

    res.json({ message: "Password updated. You can sign in with your new password." });
  } catch (error) {
    next(error);
  }
}

/** Verify email from link token (no auth required). */
async function verifyEmailWithToken(req, res, next) {
  try {
    const email = normalizeEmailInput(req.body?.email);
    const token = String(req.body?.token || "").trim();

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (!token) {
      return res.status(400).json({ message: "Verification token is required." });
    }

    const user = await User.findOne({ email }).select("+emailVerificationToken +emailVerificationExpires");
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }
    if (user.emailVerified) {
      return res.json({ message: "Email is already verified.", user: serializePublicUser(user) });
    }

    const hash = crypto.createHash("sha256").update(token).digest("hex");
    if (
      user.emailVerificationToken !== hash ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      return res.status(400).json({ message: "Invalid or expired verification link." });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.profileVersion = Number(user.profileVersion || 1) + 1;
    logAccountActivity(user, "email_verified", email);
    await user.save();

    res.json({ message: "Email verified successfully.", user: serializePublicUser(user) });
  } catch (error) {
    next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const email = normalizeEmailInput(req.body?.email);
    const password = req.body?.password;

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

    if (user.accountDeletionRequestedAt) {
      return res.status(403).json({
        code: "ACCOUNT_DELETION_PENDING",
        message:
          "This account is being deleted. If you didn't request this, contact support.",
      });
    }

    const sessionId = await recordUserSession(user, req);
    logAccountActivity(user, "sign_in", "Email sign-in");
    await user.save();

    const token = generateToken(user._id, sessionId);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      token,
      refreshToken,
      sessionId,
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

    const sessionId = String(req.headers["x-session-id"] || "").trim();
    const token = generateToken(user._id, sessionId || undefined);
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

    const { name, phone, defaultAddress, avatar, profileVersion } = req.body;
    if (
      profileVersion !== undefined &&
      Number(profileVersion) !== Number(user.profileVersion || 1)
    ) {
      return res.status(409).json({
        code: "PROFILE_VERSION_CONFLICT",
        message: "Profile was updated elsewhere.",
        profileVersion: Number(user.profileVersion || 1),
      });
    }
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

    user.profileVersion = Number(user.profileVersion || 1) + 1;
    logAccountActivity(user, "profile_update", "Profile saved");
    const sid = String(req.headers["x-session-id"] || "").trim();
    touchSession(user, sid);
    await user.save();
    res.json(serializePublicUser(user));
  } catch (error) {
    next(error);
  }
}

async function sendVerificationEmail(req, res, next) {
  try {
    const user = await User.findById(req.user._id).select("+emailVerificationToken +emailVerificationExpires");
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.emailVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    logAccountActivity(user, "verification_sent", user.email);
    await user.save();
    let delivery;
    try {
      delivery = await sendEmailVerificationEmail(user.email, rawToken);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[send-verification]", err?.message || err);
      return res.status(502).json({
        message: "Could not send verification email. Check SMTP settings and try again.",
      });
    }
    if (!delivery?.sent) {
      return res.status(503).json({
        message: "Email delivery is not configured on the server.",
        ...(process.env.NODE_ENV !== "production" && delivery?.link ? { devLink: delivery.link } : {}),
      });
    }
    res.json({ message: "Verification email sent." });
  } catch (error) {
    next(error);
  }
}

async function requestAccountDeletion(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.accountDeletionRequestedAt) {
      return res.status(400).json({ message: "Account deletion is already in progress." });
    }
    user.accountDeletionRequestedAt = new Date();
    logAccountActivity(user, "deletion_requested", req.body?.reason || "");
    await user.save();
    res.json({
      message: "Account scheduled for deletion. You will be signed out.",
      user: serializePublicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required." });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }
    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found." });
    const valid = await bcrypt.compare(String(currentPassword), user.password);
    if (!valid) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }
    user.password = await bcrypt.hash(String(newPassword), 10);
    logAccountActivity(user, "password_change", "Password updated");
    await user.save();
    res.json({ message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
}

async function requestEmailChange(req, res, next) {
  try {
    const { newEmail, currentPassword } = req.body || {};
    const normalized = normalizeEmailInput(newEmail);
    if (!normalized || !EMAIL_RE.test(normalized)) {
      return res.status(400).json({ message: "Enter a valid new email address." });
    }
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required." });
    }
    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found." });
    const valid = await bcrypt.compare(String(currentPassword), user.password);
    if (!valid) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }
    const taken = await User.findOne({ email: normalized, _id: { $ne: user._id } });
    if (taken) {
      return res.status(409).json({ message: "That email is already in use." });
    }
    user.pendingEmail = normalized;
    logAccountActivity(user, "email_change_requested", normalized);
    await user.save();
    try {
      await sendPasswordResetEmail(user.email, `notify-email-change-${Date.now()}`);
    } catch {
      /* notification to old email best-effort */
    }
    res.json({
      message: "Confirmation sent to your current email. Verify the new address from the link we email you.",
      pendingEmail: normalized,
    });
  } catch (error) {
    next(error);
  }
}

async function requestPhoneOtp(req, res, next) {
  try {
    const newPhone = String(req.body?.newPhone || "").replace(/\D/g, "");
    if (newPhone.length < 10) {
      return res.status(400).json({ message: "Enter a valid phone number." });
    }
    const user = await User.findById(req.user._id).select("+phoneOtpHash +phoneOtpExpires");
    if (!user) return res.status(404).json({ message: "User not found." });
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.pendingPhone = newPhone;
    user.phoneOtpHash = crypto.createHash("sha256").update(otp).digest("hex");
    user.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    logAccountActivity(user, "phone_otp_sent", newPhone.slice(-4));
    await user.save();
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info(`[phone-otp] ${newPhone} → ${otp}`);
    }
    res.json({ message: "Verification code sent.", maskedPhone: `••••${newPhone.slice(-4)}` });
  } catch (error) {
    next(error);
  }
}

async function verifyPhoneOtp(req, res, next) {
  try {
    const newPhone = String(req.body?.newPhone || "").replace(/\D/g, "");
    const otp = String(req.body?.otp || "").trim();
    if (!newPhone || !otp) {
      return res.status(400).json({ message: "Phone and verification code are required." });
    }
    const user = await User.findById(req.user._id).select("+phoneOtpHash +phoneOtpExpires");
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.phoneOtpExpires || user.phoneOtpExpires < new Date()) {
      return res.status(400).json({ message: "Code expired. Request a new one." });
    }
    if (user.pendingPhone !== newPhone) {
      return res.status(400).json({ message: "Phone number does not match the pending change." });
    }
    const hash = crypto.createHash("sha256").update(otp).digest("hex");
    if (hash !== user.phoneOtpHash) {
      return res.status(401).json({ message: "Invalid verification code." });
    }
    user.phone = newPhone;
    user.pendingPhone = "";
    user.phoneOtpHash = null;
    user.phoneOtpExpires = null;
    user.profileVersion = Number(user.profileVersion || 1) + 1;
    logAccountActivity(user, "phone_change", newPhone.slice(-4));
    await user.save();
    res.json(serializePublicUser(user));
  } catch (error) {
    next(error);
  }
}

async function getActiveSessions(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });
    const currentSid =
      String(req.headers["x-session-id"] || "").trim() ||
      (() => {
        try {
          const token = String(req.headers.authorization || "").split(" ")[1];
          const decoded = require("jsonwebtoken").verify(token, process.env.JWT_SECRET);
          return decoded.sid || "";
        } catch {
          return "";
        }
      })();
    const sessions = (user.activeSessions || []).map((s) => ({
      sessionId: s.sessionId,
      deviceName: s.deviceName,
      location: s.location,
      lastActiveAt: s.lastActiveAt,
      current: s.sessionId === currentSid,
    }));
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
}

async function revokeSession(req, res, next) {
  try {
    const sessionId = String(req.params.sessionId || "").trim();
    if (!sessionId) return res.status(400).json({ message: "sessionId is required." });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });
    const currentSid = String(req.headers["x-session-id"] || "").trim();
    if (sessionId === currentSid) {
      return res.status(400).json({ message: "Cannot revoke the current session." });
    }
    user.activeSessions = (user.activeSessions || []).filter((s) => s.sessionId !== sessionId);
    logAccountActivity(user, "session_revoked", sessionId.slice(0, 8));
    await user.save();
    res.json({ message: "Session revoked." });
  } catch (error) {
    next(error);
  }
}

async function getAccountActivity(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
    const events = (user.accountActivity || [])
      .filter((e) => new Date(e.at).getTime() >= cutoff)
      .map((e) => ({
        type: e.type,
        detail: e.detail,
        at: e.at,
      }));
    res.json({ events });
  } catch (error) {
    next(error);
  }
}

async function uploadUserAvatar(req, res, next) {
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
  requestPasswordReset,
  resetPasswordWithToken,
  verifyEmailWithToken,
  refreshAccessToken,
  getProfile,
  updateProfile,
  sendVerificationEmail,
  requestAccountDeletion,
  changePassword,
  requestEmailChange,
  requestPhoneOtp,
  verifyPhoneOtp,
  getActiveSessions,
  revokeSession,
  getAccountActivity,
  uploadUserAvatar,
  getAllUsers,
  updateUserAdminStatus,
  updateUserDeliveryPartnerStatus,
  deleteUser,
  upsertPushToken,
  getMyCart,
  replaceMyCart,
};

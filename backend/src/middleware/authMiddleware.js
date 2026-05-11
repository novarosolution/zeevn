const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized. Token missing." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type === "refresh") {
      return res.status(401).json({ message: "Refresh token cannot be used as access token." });
    }
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Not authorized. User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized. Invalid token." });
  }
}

module.exports = {
  protect,
  adminOnly: (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required." });
    }
    next();
  },
  deliveryPartnerOnly: (req, res, next) => {
    if (!req.user || !req.user.isDeliveryPartner) {
      return res.status(403).json({ message: "Delivery partner access required." });
    }
    next();
  },
};

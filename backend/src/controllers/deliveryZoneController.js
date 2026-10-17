const DeliveryZone = require("../models/DeliveryZone");
const User = require("../models/User");
const Order = require("../models/Order");
const {
  resolveDeliveryQuote,
  findPostalCodeConflict,
  sanitizeZoneBody,
  normalizePostalCode,
} = require("../services/deliveryZoneService");

const LIVE_ASSIGN_STATUSES = ["ready_for_pickup", "shipped", "out_for_delivery"];

/** Public — checkout serviceability check. */
async function checkDeliveryServiceability(req, res, next) {
  try {
    const postalCode = req.query.postalCode || req.query.pin || "";
    const city = req.query.city || "";
    const itemsTotal = Number(req.query.itemsTotal || 0);
    const quote = await resolveDeliveryQuote({ postalCode, city, itemsTotal });
    res.json({
      ...quote,
      postalCode: normalizePostalCode(postalCode) || "",
      city: String(city || "").trim(),
    });
  } catch (error) {
    next(error);
  }
}

async function listDeliveryZones(req, res, next) {
  try {
    const zones = await DeliveryZone.find()
      .sort({ name: 1 })
      .populate("partnerIds", "name email phone isDeliveryPartner")
      .lean();
    res.json(zones);
  } catch (error) {
    next(error);
  }
}

async function createDeliveryZone(req, res, next) {
  try {
    const data = sanitizeZoneBody(req.body);
    if (!data.name) {
      return res.status(400).json({ message: "Zone name is required." });
    }
    if (!data.postalCodes.length && !data.cities.length) {
      return res.status(400).json({ message: "Add at least one pincode or city." });
    }
    const conflict = await findPostalCodeConflict(data.postalCodes);
    if (conflict) {
      return res.status(400).json({ message: conflict });
    }
    const zone = await DeliveryZone.create(data);
    const populated = await DeliveryZone.findById(zone._id)
      .populate("partnerIds", "name email phone isDeliveryPartner");
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

async function updateDeliveryZone(req, res, next) {
  try {
    const zone = await DeliveryZone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ message: "Delivery zone not found." });
    }
    const data = sanitizeZoneBody({ ...zone.toObject(), ...req.body });
    if (!data.name) {
      return res.status(400).json({ message: "Zone name is required." });
    }
    const conflict = await findPostalCodeConflict(data.postalCodes, zone._id);
    if (conflict) {
      return res.status(400).json({ message: conflict });
    }
    Object.assign(zone, data);
    await zone.save();
    const populated = await DeliveryZone.findById(zone._id)
      .populate("partnerIds", "name email phone isDeliveryPartner");
    res.json(populated);
  } catch (error) {
    next(error);
  }
}

async function deleteDeliveryZone(req, res, next) {
  try {
    const zone = await DeliveryZone.findByIdAndDelete(req.params.id);
    if (!zone) {
      return res.status(404).json({ message: "Delivery zone not found." });
    }
    res.json({ ok: true, id: String(zone._id) });
  } catch (error) {
    next(error);
  }
}

/** Admin — delivery partners with GPS age + active order count. */
async function listDeliveryPartners(req, res, next) {
  try {
    const partners = await User.find({ isDeliveryPartner: true })
      .select("name email phone deliveryLiveLocation createdAt")
      .lean();

    const counts = await Order.aggregate([
      {
        $match: {
          assignedDeliveryUser: { $ne: null },
          status: { $in: LIVE_ASSIGN_STATUSES },
        },
      },
      { $group: { _id: "$assignedDeliveryUser", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    const now = Date.now();
    res.json(
      partners.map((p) => {
        const updatedAt = p.deliveryLiveLocation?.updatedAt
          ? new Date(p.deliveryLiveLocation.updatedAt).getTime()
          : null;
        return {
          _id: p._id,
          name: p.name || "",
          email: p.email || "",
          phone: p.phone || "",
          activeOrderCount: countMap.get(String(p._id)) || 0,
          lastLocationAt: updatedAt ? new Date(updatedAt).toISOString() : null,
          lastLocationAgeSeconds:
            updatedAt != null ? Math.max(0, Math.round((now - updatedAt) / 1000)) : null,
          hasLiveLocation: Boolean(
            Number.isFinite(Number(p.deliveryLiveLocation?.latitude)) &&
              Number.isFinite(Number(p.deliveryLiveLocation?.longitude))
          ),
        };
      })
    );
  } catch (error) {
    next(error);
  }
}

module.exports = {
  checkDeliveryServiceability,
  listDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
  listDeliveryPartners,
};

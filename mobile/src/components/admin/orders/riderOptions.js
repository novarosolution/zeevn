import React from "react";
import { timeAgo } from "../../../utils/adminFormat";
import AdminAvatar from "../AdminAvatar";

function riderHint(rider) {
  if (rider.online) return "Online now";
  if (rider.location?.updatedAt) return `Last seen ${timeAgo(rider.location.updatedAt)}`;
  return "No location yet";
}

/**
 * Options for an `AdminSelect` of riders. Riders who cover the order's zone come first under their own heading;
 * each row shows presence, last-seen and how many orders the rider is carrying right now.
 */
export function buildRiderOptions(riders = [], zoneId = null) {
  const covers = (rider) => Boolean(zoneId) && (rider.zones || []).some((z) => String(z._id) === String(zoneId));
  const toOption = (rider) => ({
    value: String(rider._id),
    label: rider.name || "Rider",
    hint: riderHint(rider),
    meta: rider.active ? `${rider.active} active` : "free",
    leading: <AdminAvatar name={rider.name} size={26} online={rider.online} />,
  });

  const inZone = riders.filter(covers);
  const others = riders.filter((rider) => !covers(rider));
  const options = [];
  if (inZone.length) {
    options.push({ header: "Covers this zone" }, ...inZone.map(toOption));
    if (others.length) options.push({ header: "Other riders" });
  }
  options.push(...others.map(toOption));
  return options;
}

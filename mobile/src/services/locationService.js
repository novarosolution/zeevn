import { Platform } from "react-native";
import * as Location from "expo-location";

const NOMINATIM_UA = "ZeevanShop/1.0 (https://www.zeevan.shop; hello@zeevan.shop)";
const GPS_TIMEOUT_MS = 12_000;

export function validMapCoord(n) {
  const v = Number(n);
  return Number.isFinite(v) && Math.abs(v) > 0.2;
}

/** India only — drops iOS Simulator default (San Francisco) and other junk GPS. */
export function validDeliveryCoord(lat, lng) {
  const a = Number(lat);
  const b = Number(lng);
  return Number.isFinite(a) && Number.isFinite(b) && a >= 6 && a <= 38 && b >= 68 && b <= 98;
}

function coordsOnly(latitude, longitude) {
  return {
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    latitude: Number(latitude),
    longitude: Number(longitude),
    label: "",
  };
}

async function nominatimFetch(url) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 8000) : null;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": NOMINATIM_UA,
      },
      signal: controller?.signal,
    });
    if (!response.ok) {
      throw new Error("Unable to fetch location details.");
    }
    return response.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function reverseGeocodeWeb(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
  const data = await nominatimFetch(url);
  return placeFromNominatim(data, latitude, longitude);
}

function getCurrentPositionWeb() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(new Error(error.message || "Unable to get current location.")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/** Reverse-geocode a pin. Never throws once we have real coordinates — address text is best-effort. */
export async function addressFromCoords(latitude, longitude) {
  if (!validMapCoord(latitude) || !validMapCoord(longitude)) {
    throw new Error("Drop the pin on a real place.");
  }
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Platform.OS === "web") {
    try {
      const resolved = await reverseGeocodeWeb(lat, lng);
      return { ...resolved, latitude: lat, longitude: lng };
    } catch {
      return coordsOnly(lat, lng);
    }
  }

  try {
    const [resolved] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (resolved) {
      return {
        line1: resolved.name || resolved.street || "",
        city: resolved.city || resolved.subregion || "",
        state: resolved.region || "",
        postalCode: resolved.postalCode || "",
        country: resolved.country || "",
        latitude: lat,
        longitude: lng,
      };
    }
  } catch {
    // Android often has no geocoder — try Nominatim, then keep the pin.
  }

  try {
    const resolved = await reverseGeocodeWeb(lat, lng);
    return { ...resolved, latitude: lat, longitude: lng };
  } catch {
    return coordsOnly(lat, lng);
  }
}

function placeFromNominatim(hit, latitude, longitude) {
  const address = hit?.address || {};
  return {
    line1:
      hit?.name ||
      address.road ||
      address.neighbourhood ||
      address.suburb ||
      "",
    city: address.city || address.town || address.village || "",
    state: address.state || "",
    postalCode: address.postcode || "",
    country: address.country || "India",
    latitude,
    longitude,
    label: hit?.display_name || "",
  };
}

/** Search streets and areas in India. Used on the Select location page. */
export async function searchPlaces(query) {
  const q = String(query || "").trim();
  if (q.length < 2) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=in&q=${encodeURIComponent(q)}`;
  try {
    const rows = await nominatimFetch(url);
    const skip = new Set(["state_district", "state", "country", "county"]);
    return (Array.isArray(rows) ? rows : [])
      .filter((hit) => !skip.has(String(hit.addresstype || "")))
      .map((hit) => placeFromNominatim(hit, Number(hit.lat), Number(hit.lon)))
      .filter((place) => validMapCoord(place.latitude) && validMapCoord(place.longitude));
  } catch {
    return [];
  }
}

async function readNativePosition() {
  const current = Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const timed = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Location timed out.")), GPS_TIMEOUT_MS);
  });
  try {
    return await Promise.race([current, timed]);
  } catch (first) {
    try {
      const last = await Location.getLastKnownPositionAsync();
      if (last?.coords) return last;
    } catch {
      // no cache
    }
    throw first instanceof Error ? first : new Error("Unable to get current location.");
  }
}

export async function getCurrentAddressFromGPS() {
  if (Platform.OS === "web") {
    const position = await getCurrentPositionWeb();
    return addressFromCoords(position.coords.latitude, position.coords.longitude);
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error("Location permission denied. Allow location or pick a place on the map.");
  }

  const location = await readNativePosition();
  const lat = location.coords.latitude;
  const lng = location.coords.longitude;
  if (!validDeliveryCoord(lat, lng)) {
    throw new Error("We couldn't find an India address. Pick your place on the map.");
  }
  return addressFromCoords(lat, lng);
}

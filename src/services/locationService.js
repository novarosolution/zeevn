import { Platform } from "react-native";
import * as Location from "expo-location";
import { getApiBaseUrl } from "./apiBase";

async function reverseGeocodeWeb(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to fetch location details.");
  }

  const data = await response.json();
  const address = data.address || {};

  return {
    line1:
      data.name ||
      address.road ||
      address.neighbourhood ||
      address.suburb ||
      "",
    city: address.city || address.town || address.village || "",
    state: address.state || "",
    postalCode: address.postcode || "",
    country: address.country || "",
  };
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

export async function getCurrentAddressFromGPS() {
  if (Platform.OS === "web") {
    const position = await getCurrentPositionWeb();
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const resolved = await reverseGeocodeWeb(latitude, longitude);
    return { ...resolved, latitude, longitude };
  }

  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error("Location permission denied.");
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const [resolved] = await Location.reverseGeocodeAsync({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  });

  return {
    line1: resolved?.name || resolved?.street || "",
    city: resolved?.city || resolved?.subregion || "",
    state: resolved?.region || "",
    postalCode: resolved?.postalCode || "",
    country: resolved?.country || "",
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

/**
 * Resolve city/state/country for a pincode using backend first, then public fallback.
 */
export async function getAddressFromPincode(pincode) {
  const digits = String(pincode || "").replace(/\D/g, "");
  if (digits.length !== 6) {
    throw new Error("Enter a valid 6-digit pincode.");
  }

  const apiBase = getApiBaseUrl();
  try {
    const response = await fetch(`${apiBase}/delivery/pincode/${digits}`);
    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      const city = String(data?.city || data?.district || "").trim();
      const state = String(data?.state || "").trim();
      const country = String(data?.country || "India").trim();
      if (city || state || country) {
        return { city, state, country };
      }
    }
  } catch {
    /* fallback below */
  }

  const fallbackResponse = await fetch(`https://api.postalpincode.in/pincode/${digits}`);
  const fallbackData = await fallbackResponse.json().catch(() => []);
  const first = Array.isArray(fallbackData) ? fallbackData[0] : null;
  const office = Array.isArray(first?.PostOffice) ? first.PostOffice[0] : null;
  const city = String(office?.District || office?.Division || "").trim();
  const state = String(office?.State || "").trim();
  const country = String(office?.Country || "India").trim();
  if (!city && !state) {
    throw new Error("Could not auto-fill this pincode.");
  }
  return { city, state, country };
}

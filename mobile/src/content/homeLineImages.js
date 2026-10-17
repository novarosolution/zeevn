/**
 * Generated premium stills for home category tiles + trust strip.
 */
export const HOME_LINE_IMAGES = {
  ghee: require("../../assets/category-ghee.jpg"),
  tel: require("../../assets/category-tel.jpg"),
  masala: require("../../assets/category-masala.jpg"),
  honey: require("../../assets/category-honey.jpg"),
};

export const HOME_TRUST_IMAGES = {
  pure: require("../../assets/trust-pure.jpg"),
  batch: require("../../assets/trust-batch.jpg"),
  track: require("../../assets/trust-track.jpg"),
  secure: require("../../assets/trust-secure.jpg"),
};

export function getHomeLineImage(key) {
  return HOME_LINE_IMAGES[key] || null;
}

export function getHomeTrustImage(key) {
  return HOME_TRUST_IMAGES[key] || null;
}

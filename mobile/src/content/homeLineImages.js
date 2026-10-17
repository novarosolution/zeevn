/**
 * Generated premium stills for home category tiles + trust strip.
 */
export const HOME_LINE_IMAGES = {
  ghee: require("../../assets/line-ghee-premium.jpg"),
  tel: require("../../assets/line-tel-premium.jpg"),
  masala: require("../../assets/line-masala-premium.jpg"),
  honey: require("../../assets/line-honey-premium.jpg"),
};

export const HOME_TRUST_IMAGES = {
  pure: require("../../assets/home-trust-pure.jpg"),
  batch: require("../../assets/home-trust-batch.jpg"),
  track: require("../../assets/home-trust-track.jpg"),
  secure: require("../../assets/home-trust-secure.jpg"),
};

export function getHomeLineImage(key) {
  return HOME_LINE_IMAGES[key] || null;
}

export function getHomeTrustImage(key) {
  return HOME_TRUST_IMAGES[key] || null;
}

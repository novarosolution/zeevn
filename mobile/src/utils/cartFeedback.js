/**
 * A dependency-free flag shared by the cart and the fly-to-cart animation (kept out of the animation module so
 * the cart context never pulls native animation code into the web bundle).
 * While a product is flying to the cart button, the "added to bag" toast stays quiet — the flight is the feedback.
 */
let quietUntil = 0;

export function markCartFlight(ms) {
  quietUntil = Date.now() + ms;
}

export function isCartFlightActive() {
  return Date.now() < quietUntil;
}

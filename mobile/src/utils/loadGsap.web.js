/** GSAP — sync require on web (dynamic import() breaks Metro static export chunks). */
let scrollTriggerRegistered = false;

/** Keep in sync with `HOME_SCREEN_UI.web.enableHomeGsap` in appContent.js */
const WEB_HOME_GSAP_ENABLED = false;

function isWebGsapEnabled() {
  return WEB_HOME_GSAP_ENABLED;
}

export async function getGsap() {
  if (!isWebGsapEnabled()) return null;
  return require("gsap").gsap;
}

export async function getScrollTrigger() {
  if (!isWebGsapEnabled()) return null;
  const gsap = require("gsap").gsap;
  const stMod = require("gsap/ScrollTrigger");
  if (!scrollTriggerRegistered) {
    gsap.registerPlugin(stMod.ScrollTrigger);
    scrollTriggerRegistered = true;
  }
  return stMod.ScrollTrigger;
}

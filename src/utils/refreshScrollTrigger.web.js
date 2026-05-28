import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (gsap?.registerPlugin && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

export function refreshScrollTrigger() {
  if (typeof ScrollTrigger?.refresh === "function") {
    ScrollTrigger.refresh();
  }
}

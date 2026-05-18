import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (gsap?.registerPlugin && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

/** Static import — dynamic `import()` splits chunks that fail on static web export. */
export function loadGsap() {
  return Promise.resolve(gsap);
}

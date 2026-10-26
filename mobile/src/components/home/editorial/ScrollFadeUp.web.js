import React from "react";
import SectionReveal from "../../motion/SectionReveal";

/** Web — passthrough to lightweight SectionReveal.web (no GSAP/Reanimated). */
export default function ScrollFadeUp({ children, style, ...rest }) {
  return (
    <SectionReveal style={style} {...rest}>
      {children}
    </SectionReveal>
  );
}

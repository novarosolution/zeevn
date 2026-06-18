import React from "react";
import { View } from "react-native";

/** Web — no Reanimated/GSAP on the critical path; sections render immediately. */
export default function SectionReveal({ children, style, pointerEvents }) {
  const pointerStyle = pointerEvents ? { pointerEvents } : null;
  return <View style={[style, pointerStyle]}>{children}</View>;
}

SectionReveal.NATIVE_FADE_DISTANCE = 18;

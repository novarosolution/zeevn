import React from "react";
import { StyleSheet } from "react-native";
import SectionReveal from "../motion/SectionReveal";
import KankregResponsiveGrid from "./KankregResponsiveGrid";
import useStaggeredReveal from "../../hooks/useStaggeredReveal";
import { motionStagger } from "../../theme/motion";

/**
 * Product/catalog grid with capped staggered reveals per child.
 */
export default function CatalogGridReveal({
  children,
  variant = "catalog",
  style,
  gridStyle,
  /** First N grid cells reveal immediately on web (avoids opacity:0 above the fold). */
  immediateFirst = 8,
  /** Override stagger gap between child reveals (ms). */
  staggerGap,
  staggerInitialDelay,
}) {
  const childArray = React.Children.toArray(children).filter(Boolean);
  const delays = useStaggeredReveal(childArray.length, {
    gap: staggerGap ?? motionStagger.gap,
    initialDelay: staggerInitialDelay ?? motionStagger.initialDelay,
  });

  return (
    <KankregResponsiveGrid variant={variant} style={[style, gridStyle]}>
      {childArray.map((child, i) => (
        <SectionReveal
          key={child.key ?? `grid-${i}`}
          delay={delays[i]}
          preset="fade-up"
          immediate={i < immediateFirst}
          style={styles.revealCell}
        >
          {child}
        </SectionReveal>
      ))}
    </KankregResponsiveGrid>
  );
}

const styles = StyleSheet.create({
  revealCell: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
  },
});

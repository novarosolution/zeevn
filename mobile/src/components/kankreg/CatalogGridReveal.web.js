import React from "react";
import { StyleSheet, View } from "react-native";
import KankregResponsiveGrid from "./KankregResponsiveGrid";
import SectionReveal from "../motion/SectionReveal";

/**
 * Web catalog grid with staggered reveal.
 * `featuredFirst` — first item full-width, rest in responsive grid.
 */
export default function CatalogGridReveal({
  children,
  variant = "catalog",
  style,
  gridStyle,
  featuredFirst = false,
  immediateFirst = 4,
}) {
  const childArray = React.Children.toArray(children).filter(Boolean);

  const wrap = (child, i) => (
    <SectionReveal
      key={child.key ?? `reveal-${i}`}
      index={i}
      preset={i === 0 && featuredFirst ? "fade-in" : "fade-up"}
      immediate={i < immediateFirst}
      style={styles.cell}
    >
      {child}
    </SectionReveal>
  );

  if (!featuredFirst || childArray.length < 1) {
    return (
      <KankregResponsiveGrid variant={variant} style={[style, gridStyle]}>
        {childArray.map((child, i) => wrap(child, i))}
      </KankregResponsiveGrid>
    );
  }

  const [first, ...rest] = childArray;

  return (
    <View style={[styles.atelier, style, gridStyle]}>
      <View style={styles.featured}>{wrap(first, 0)}</View>
      {rest.length ? (
        <KankregResponsiveGrid variant={variant}>
          {rest.map((child, i) => wrap(child, i + 1))}
        </KankregResponsiveGrid>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  atelier: {
    width: "100%",
    gap: 22,
  },
  featured: {
    width: "100%",
    minWidth: 0,
  },
  cell: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    height: "100%",
  },
});

import React from "react";
import { StyleSheet, View } from "react-native";
import KankregResponsiveGrid from "./KankregResponsiveGrid";

/** Web — plain product grid (no stagger/reveal JS on the main thread). */
export default function CatalogGridReveal({ children, variant = "catalog", style, gridStyle }) {
  const childArray = React.Children.toArray(children).filter(Boolean);

  return (
    <KankregResponsiveGrid variant={variant} style={[style, gridStyle]}>
      {childArray.map((child, i) => (
        <View key={child.key ?? `grid-${i}`} style={styles.cell}>
          {child}
        </View>
      ))}
    </KankregResponsiveGrid>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
  },
});

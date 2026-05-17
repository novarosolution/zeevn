import React, { memo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { breakpoints } from "../../../theme/tokens";

function AccountGridBase({ children, gap = 16 }) {
  const { width } = useWindowDimensions();
  const twoCol = width >= breakpoints.md;
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={[styles.row, { gap }]}>
      {items.map((child, index) => (
        <View
          key={child.key ?? `grid-${index}`}
          style={twoCol ? styles.cellHalf : styles.cellFull}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  cellFull: {
    width: "100%",
  },
  cellHalf: {
    width: "48%",
    flexGrow: 1,
    maxWidth: "48%",
  },
});

const AccountGrid = memo(AccountGridBase);
export default AccountGrid;

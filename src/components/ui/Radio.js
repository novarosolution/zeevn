import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/**
 * Single radio option stub. Parent manages selected value across a group.
 */
function RadioBase({ selected = false, onPress, label, disabled = false, style, testID }) {
  const { semanticPalette, TYPE } = useTheme();

  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={typeof label === "string" ? label : undefined}
      style={[styles.row, style, disabled ? { opacity: 0.5 } : null]}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: 1.5,
          borderColor: selected ? semanticPalette.accentOnLight : semanticPalette.accent,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected ? (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: semanticPalette.accent,
            }}
          />
        ) : null}
      </View>
      {label ? (
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: TYPE.small.fontSize,
            color: semanticPalette.inkSoft,
          }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

const Radio = memo(RadioBase);

export default Radio;

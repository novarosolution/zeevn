import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStoreTheme } from "../../theme/storefront";

/**
 * Storefront text field: label stacked over the value inside a rounded cream box.
 * Border turns olive on focus and red on error; the error line sits underneath.
 */
export default function StoreField({
  label,
  icon,
  value,
  onChangeText,
  error,
  multiline = false,
  style,
  inputStyle,
  onFocus,
  onBlur,
  ...inputProps
}) {
  const { c, r, type } = useStoreTheme();
  const [focused, setFocused] = useState(false);
  const accent = error ? c.danger : focused ? c.brand : c.inkMute;

  return (
    <View style={style}>
      <View
        style={[
          styles.box,
          {
            backgroundColor: c.cardSoft,
            borderColor: error ? c.danger : focused ? c.brand : c.line,
            borderWidth: error || focused ? 1.5 : 1,
            borderRadius: r.lg,
          },
        ]}
      >
        {icon ? <Ionicons name={icon} size={19} color={accent} style={styles.icon} /> : null}
        <View style={styles.col}>
          <Text style={type.ui(11.5, "bold", accent, { letterSpacing: 0.3 })} numberOfLines={1}>
            {label}
          </Text>
          <TextInput
            {...inputProps}
            value={value}
            onChangeText={onChangeText}
            multiline={multiline}
            placeholderTextColor={c.inkMute}
            selectionColor={c.brand}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[type.ui(16, "semibold", c.ink), styles.input, multiline && styles.multiline, inputStyle]}
          />
        </View>
      </View>
      {error ? <Text style={[type.ui(12, "medium", c.danger), styles.error]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 9, minHeight: 58 },
  icon: { width: 22, textAlign: "center" },
  col: { flex: 1, minWidth: 0, gap: 1 },
  input: { paddingVertical: 2, minHeight: 24 },
  multiline: { minHeight: 56, textAlignVertical: "top" },
  error: { marginTop: 5, marginLeft: 4 },
});

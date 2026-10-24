import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { getAdminChrome } from "../../theme/adminLayout";
import { fonts } from "../../theme/tokens";

/** Compact − / qty / + for inventory desks. */
export default function AdminQtyStepper({ value, busy, onMinus, onPlus, onChange, onCommit }) {
  const { colors: c, isDark } = useTheme();
  const chrome = useMemo(() => getAdminChrome(c, isDark), [c, isDark]);
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onMinus}
        disabled={busy}
        hitSlop={6}
        accessibilityLabel="Decrease stock"
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        <Ionicons name="remove" size={14} color={chrome.ink} />
      </Pressable>
      <TextInput
        value={String(value ?? "0")}
        onChangeText={onChange}
        onSubmitEditing={onCommit}
        onBlur={onCommit}
        editable={!busy}
        keyboardType="number-pad"
        style={styles.field}
      />
      <Pressable
        onPress={onPlus}
        disabled={busy}
        hitSlop={6}
        accessibilityLabel="Increase stock"
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      >
        <Ionicons name="add" size={14} color={chrome.ink} />
      </Pressable>
    </View>
  );
}

function createStyles(chrome) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: chrome.paper,
      alignSelf: "flex-start",
    },
    btn: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({ web: { cursor: "pointer", transition: "transform 100ms ease-out" }, default: {} }),
    },
    pressed: { transform: [{ scale: 0.97 }] },
    field: {
      width: 44,
      height: 32,
      textAlign: "center",
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: chrome.ink,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      paddingVertical: 0,
    },
  });
}

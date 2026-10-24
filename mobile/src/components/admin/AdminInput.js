import React, { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WEB_NO_FOCUS_RING, useAdminChrome } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/**
 * Compact labelled field for admin forms. `numeric` keeps digits and one dot, `integer` digits only.
 * `prefix` / `suffix` sit inside the field ("₹", "min", "km").
 */
export default function AdminInput({
  label,
  hint,
  error,
  value,
  onChangeText,
  placeholder,
  prefix,
  suffix,
  icon,
  multiline = false,
  numberOfLines = 3,
  numeric = false,
  integer = false,
  maxLength,
  editable = true,
  autoFocus,
  autoCapitalize = "none",
  inputMode,
  onBlur,
  onFocus,
  onSubmitEditing,
  style,
  inputStyle,
  align,
}) {
  const chrome = useAdminChrome();
  const { isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const styles = useMemo(() => createStyles(chrome, getAdminTone("red", isDark)), [chrome, isDark]);

  const handleChange = (text) => {
    let next = text;
    if (integer) next = next.replace(/\D/g, "");
    else if (numeric) {
      next = next.replace(/[^\d.]/g, "");
      const firstDot = next.indexOf(".");
      if (firstDot >= 0) next = next.slice(0, firstDot + 1) + next.slice(firstDot + 1).replace(/\./g, "");
    }
    onChangeText?.(next);
  };

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          multiline && styles.fieldMulti,
          focused && styles.fieldFocus,
          Boolean(error) && styles.fieldError,
          !editable && styles.fieldDisabled,
        ]}
      >
        {icon ? <Ionicons name={icon} size={15} color={chrome.inkFaint} /> : null}
        {prefix ? <Text style={styles.affix}>{prefix}</Text> : null}
        <TextInput
          value={value == null ? "" : String(value)}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={chrome.inkFaint}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          maxLength={maxLength}
          editable={editable}
          autoFocus={autoFocus}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          inputMode={inputMode || (integer ? "numeric" : numeric ? "decimal" : undefined)}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onSubmitEditing={onSubmitEditing}
          style={[styles.input, multiline && styles.inputMulti, align === "right" && styles.alignRight, inputStyle, WEB_NO_FOCUS_RING]}
        />
        {suffix ? <Text style={styles.affix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function createStyles(chrome, red) {
  return StyleSheet.create({
    wrap: { minWidth: 0 },
    label: {
      fontSize: 11,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: chrome.inkFaint,
      fontFamily: fonts.semibold,
      marginBottom: 6,
    },
    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      minHeight: 40,
      paddingHorizontal: 12,
      borderRadius: 11,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      backgroundColor: chrome.card,
      ...Platform.select({ web: { transition: "border-color 120ms ease-out, box-shadow 120ms ease-out" }, default: {} }),
    },
    fieldMulti: { alignItems: "flex-start", paddingVertical: 9 },
    fieldFocus: {
      borderColor: chrome.tabOnBg,
      ...Platform.select({ web: { boxShadow: "0 0 0 3px rgba(85, 107, 50, 0.16)" }, default: {} }),
    },
    fieldError: { borderColor: red.solid },
    fieldDisabled: { backgroundColor: chrome.paper, opacity: 0.75 },
    input: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 9,
      fontSize: 13.5,
      color: chrome.ink,
      fontFamily: fonts.medium,
      ...Platform.select({ web: { outlineStyle: "none" }, default: {} }),
    },
    inputMulti: { minHeight: 64, textAlignVertical: "top", paddingVertical: 0, fontFamily: fonts.regular, lineHeight: 19 },
    alignRight: { textAlign: "right" },
    affix: { fontSize: 13, color: chrome.inkFaint, fontFamily: fonts.semibold },
    hint: { marginTop: 5, fontSize: 11.5, lineHeight: 16, color: chrome.inkFaint, fontFamily: fonts.regular },
    error: { marginTop: 5, fontSize: 11.5, lineHeight: 16, color: red.fg, fontFamily: fonts.medium },
  });
}

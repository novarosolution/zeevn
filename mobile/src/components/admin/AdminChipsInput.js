import React, { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WEB_NO_FOCUS_RING, useAdminChrome } from "../../theme/adminLayout";
import { getAdminTone } from "../../theme/adminTones";
import { useTheme } from "../../context/ThemeContext";
import { fonts } from "../../theme/tokens";

/**
 * Tag-style list editor (pincodes, cities). Type a value and press Enter, comma or space — pasting a whole list works too.
 * `normalize(raw)` returns the stored form (or "" to reject); `invalidMessage` explains a rejection.
 */
export default function AdminChipsInput({
  label,
  hint,
  values = [],
  onChange,
  placeholder = "Type and press Enter",
  normalize = (raw) => String(raw).trim(),
  invalidMessage = "That doesn't look right.",
  separators = /[,\s\n]+/,
  tone = "olive",
  maxItems = 300,
  disabled = false,
}) {
  const chrome = useAdminChrome();
  const { isDark } = useTheme();
  const t = getAdminTone(tone, isDark);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const styles = useMemo(() => createStyles(chrome), [chrome]);

  const commit = (raw) => {
    const pieces = String(raw)
      .split(separators)
      .map((piece) => piece.trim())
      .filter(Boolean);
    if (!pieces.length) return;
    const next = [...values];
    let rejected = 0;
    for (const piece of pieces) {
      const clean = normalize(piece);
      if (!clean) {
        rejected += 1;
      } else if (!next.includes(clean) && next.length < maxItems) {
        next.push(clean);
      }
    }
    if (next.length !== values.length) onChange?.(next);
    setText("");
    setError(rejected ? invalidMessage : "");
  };

  const remove = (value) => onChange?.(values.filter((v) => v !== value));

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, focused && styles.fieldFocus, Boolean(error) && styles.fieldError, disabled && styles.fieldDisabled]}>
        {values.map((value) => (
          <View key={value} style={[styles.chip, { backgroundColor: t.bg, borderColor: t.border }]}>
            <Text style={[styles.chipText, { color: t.fg }]}>{value}</Text>
            {disabled ? null : (
              <Pressable onPress={() => remove(value)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Remove ${value}`}>
                <Ionicons name="close" size={13} color={t.fg} />
              </Pressable>
            )}
          </View>
        ))}
        <TextInput
          value={text}
          onChangeText={(next) => {
            setError("");
            if (/[,\s]$/.test(next) && next.trim()) commit(next);
            else setText(next);
          }}
          onSubmitEditing={() => commit(text)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (text.trim()) commit(text);
          }}
          onKeyPress={(e) => {
            if (e?.nativeEvent?.key === "Backspace" && !text && values.length) remove(values[values.length - 1]);
          }}
          editable={!disabled}
          placeholder={values.length ? "" : placeholder}
          placeholderTextColor={chrome.inkFaint}
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
          style={[styles.input, WEB_NO_FOCUS_RING]}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function createStyles(chrome) {
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
      flexWrap: "wrap",
      alignItems: "center",
      gap: 6,
      minHeight: 42,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 11,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: chrome.line,
      backgroundColor: chrome.card,
      ...Platform.select({ web: { cursor: "text", transition: "border-color 120ms ease-out, box-shadow 120ms ease-out" }, default: {} }),
    },
    fieldFocus: {
      borderColor: chrome.tabOnBg,
      ...Platform.select({ web: { boxShadow: "0 0 0 3px rgba(85, 107, 50, 0.16)" }, default: {} }),
    },
    fieldError: { borderColor: chrome.danger },
    fieldDisabled: { opacity: 0.6 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      height: 26,
      paddingLeft: 9,
      paddingRight: 7,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
    },
    chipText: { fontSize: 12, fontFamily: fonts.semibold, letterSpacing: 0.2 },
    input: {
      flexGrow: 1,
      flexBasis: 110,
      minWidth: 90,
      height: 26,
      paddingHorizontal: 4,
      fontSize: 13,
      color: chrome.ink,
      fontFamily: fonts.medium,
      ...Platform.select({ web: { outlineStyle: "none" }, default: {} }),
    },
    hint: { marginTop: 5, fontSize: 11.5, lineHeight: 16, color: chrome.inkFaint, fontFamily: fonts.regular },
    error: { marginTop: 5, fontSize: 11.5, lineHeight: 16, color: chrome.danger, fontFamily: fonts.medium },
  });
}

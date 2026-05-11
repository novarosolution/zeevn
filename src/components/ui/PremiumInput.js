import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, icon, radius, spacing, typography } from "../../theme/tokens";
import { inputOutlineWeb } from "../../theme/screenLayout";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";

/**
 * Premium text input with floating label, focus glow, error state, and icon
 * slots. Drop-in for `<TextInput>` on customer screens.
 *
 * Note: uses the legacy `Animated` (RN core) for label tween — no Reanimated
 * dependency in the input field for simplicity. Reanimated is reserved for
 * the press/hover surfaces.
 */
function PremiumInputBase({
  label,
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder,
  helperText,
  errorText,
  iconLeft,
  iconRight,
  onIconRightPress,
  secureTextEntry,
  multiline,
  numberOfLines,
  keyboardType,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  autoFocus,
  editable = true,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  textContentType,
  inputMode,
  testID,
  style,
  inputStyle,
  accessibilityLabel,
  accessibilityHint,
  passwordToggle = false,
}) {
  const { colors: c, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef(null);

  const hasError = Boolean(errorText);
  const hasValue = value != null && String(value).length > 0;
  const showFloating = focused || hasValue;

  useEffect(() => {
    if (reducedMotion) {
      labelAnim.setValue(showFloating ? 1 : 0);
      return;
    }
    Animated.timing(labelAnim, {
      toValue: showFloating ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [showFloating, labelAnim, reducedMotion]);

  const styles = useMemo(
    () => createStyles(c, isDark, multiline),
    [c, isDark, multiline]
  );

  const borderColor = hasError
    ? c.danger
    : focused
      ? isDark ? c.primaryBright : c.primary
      : c.border;

  const labelTopBase = multiline ? 14 : 16;
  const labelTopFloated = multiline ? 6 : 8;
  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [labelTopBase, labelTopFloated],
  });
  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [typography.bodySmall, 11],
  });
  const labelColor = hasError ? c.danger : focused ? (isDark ? c.primaryBright : c.primaryDark) : c.textMuted;

  const handleFocus = (e) => {
    setFocused(true);
    if (onFocus) onFocus(e);
  };
  const handleBlur = (e) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  const togglePassword = () => setHidden((h) => !h);
  const effectiveIconRight = passwordToggle
    ? hidden ? "eye-outline" : "eye-off-outline"
    : iconRight;
  const effectiveOnRightPress = passwordToggle ? togglePassword : onIconRightPress;

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        onPress={() => inputRef.current?.focus?.()}
        style={[
          styles.field,
          { borderColor },
          focused ? styles.fieldFocused : null,
          hasError ? styles.fieldError : null,
          !editable ? styles.fieldDisabled : null,
        ]}
      >
        {iconLeft ? (
          <View style={styles.iconLeftWrap}>
            {typeof iconLeft === "string" ? (
              <Ionicons
                name={iconLeft}
                size={icon.sm}
                color={focused ? (isDark ? c.primaryBright : c.primaryDark) : c.textMuted}
              />
            ) : (
              iconLeft
            )}
          </View>
        ) : null}
        <View style={styles.inputCol}>
          {label ? (
            <Animated.Text
              style={[
                styles.label,
                styles.peNone,
                { top: labelTop, fontSize: labelFontSize, color: labelColor },
              ]}
              numberOfLines={1}
            >
              {label}
            </Animated.Text>
          ) : null}
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={!label || showFloating ? placeholder : undefined}
            placeholderTextColor={c.textMuted}
            secureTextEntry={Boolean(secureTextEntry) && hidden}
            multiline={multiline}
            numberOfLines={numberOfLines}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            autoCorrect={autoCorrect}
            autoFocus={autoFocus}
            editable={editable}
            maxLength={maxLength}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={blurOnSubmit}
            textContentType={textContentType}
            inputMode={inputMode}
            testID={testID}
            accessibilityLabel={accessibilityLabel || label}
            accessibilityHint={accessibilityHint}
            style={[
              styles.input,
              { color: c.textPrimary },
              label ? styles.inputWithLabel : null,
              multiline ? styles.inputMultiline : null,
              inputOutlineWeb,
              inputStyle,
            ]}
          />
        </View>
        {effectiveIconRight ? (
          <Pressable
            onPress={effectiveOnRightPress}
            disabled={!effectiveOnRightPress}
            style={({ pressed }) => [styles.iconRightWrap, pressed ? { opacity: 0.6 } : null]}
            hitSlop={8}
            accessibilityRole={effectiveOnRightPress ? "button" : undefined}
            accessibilityLabel={passwordToggle ? (hidden ? "Show password" : "Hide password") : undefined}
          >
            {typeof effectiveIconRight === "string" ? (
              <Ionicons name={effectiveIconRight} size={icon.sm} color={c.textMuted} />
            ) : (
              effectiveIconRight
            )}
          </Pressable>
        ) : null}
      </Pressable>
      {errorText ? (
        <View style={styles.helperRow}>
          <Ionicons name="alert-circle" size={icon.tiny} color={c.danger} />
          <Text style={[styles.helperText, { color: c.danger }]} numberOfLines={2}>
            {errorText}
          </Text>
        </View>
      ) : helperText ? (
        <Text style={[styles.helperText, styles.helperTextNeutral, { color: c.textMuted }]} numberOfLines={2}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(c, isDark, multiline) {
  return StyleSheet.create({
    wrap: {
      width: "100%",
    },
    field: {
      flexDirection: "row",
      alignItems: multiline ? "flex-start" : "center",
      borderWidth: 1,
      borderRadius: radius.lg,
      backgroundColor: isDark ? c.surfaceMuted : c.surface,
      paddingHorizontal: spacing.md,
      minHeight: multiline ? 100 : 56,
      ...Platform.select({
        web: {
          transition: "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
        },
        default: {},
      }),
    },
    fieldFocused: {
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 0 0 3px rgba(248, 113, 113, 0.14), 0 8px 16px rgba(0,0,0,0.22)"
            : "0 0 0 3px rgba(220, 38, 38, 0.1), 0 6px 14px rgba(15, 23, 42, 0.06)",
        },
        default: {},
      }),
    },
    fieldError: {
      ...Platform.select({
        web: {
          boxShadow: isDark
            ? "0 0 0 3px rgba(248, 113, 113, 0.16), 0 8px 16px rgba(0,0,0,0.24)"
            : "0 0 0 3px rgba(220, 38, 38, 0.1), 0 6px 14px rgba(63, 63, 70, 0.05)",
        },
        default: {},
      }),
    },
    fieldDisabled: {
      opacity: 0.7,
    },
    iconLeftWrap: {
      paddingRight: 10,
      paddingLeft: 2,
      alignSelf: multiline ? "flex-start" : "center",
      paddingTop: multiline ? 16 : 0,
    },
    iconRightWrap: {
      paddingLeft: 10,
      paddingRight: 2,
      alignSelf: multiline ? "flex-start" : "center",
      paddingTop: multiline ? 14 : 0,
    },
    inputCol: {
      flex: 1,
      position: "relative",
      justifyContent: "center",
    },
    label: {
      position: "absolute",
      left: 0,
      fontFamily: fonts.semibold,
      letterSpacing: 0.24,
    },
    peNone: {
      pointerEvents: "none",
    },
    input: {
      fontFamily: fonts.medium,
      fontSize: typography.body,
      lineHeight: typography.body + 6,
      paddingVertical: 13,
      includeFontPadding: false,
      ...Platform.select({
        web: { outlineStyle: "none" },
        default: {},
      }),
    },
    inputWithLabel: {
      paddingTop: 20,
      paddingBottom: 8,
    },
    inputMultiline: {
      paddingTop: 24,
      paddingBottom: 12,
      textAlignVertical: "top",
      minHeight: 80,
    },
    helperRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
      paddingHorizontal: 4,
    },
    helperText: {
      fontFamily: fonts.medium,
      fontSize: typography.caption,
      flex: 1,
    },
    helperTextNeutral: {
      marginTop: 6,
      paddingHorizontal: 4,
    },
  });
}

const PremiumInput = memo(PremiumInputBase);

export default PremiumInput;

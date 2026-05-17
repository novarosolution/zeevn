import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, icon, lineHeight, spacing, typography } from "../../theme/tokens";
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
  const { semanticPalette, RADII } = useTheme();
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
    () => createStyles(semanticPalette, multiline, RADII),
    [RADII, multiline, semanticPalette]
  );

  const borderColor = hasError
    ? semanticPalette.sale
    : focused
      ? semanticPalette.ink
      : semanticPalette.line;

  const labelTopBase = multiline ? spacing.md : spacing.md;
  const labelTopFloated = multiline ? spacing.xs + 2 : spacing.xs + 4;
  const labelCollapsedSize = typography.bodySmall;
  const labelFloatedSize = typography.caption;

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [labelTopBase, labelTopFloated],
  });
  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [labelCollapsedSize, labelFloatedSize],
  });
  const labelColor = hasError
    ? semanticPalette.sale
    : focused
      ? semanticPalette.ink
      : semanticPalette.inkMuted;

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
                color={focused ? semanticPalette.ink : semanticPalette.inkMuted}
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
            placeholderTextColor={semanticPalette.inkMuted}
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
              { color: semanticPalette.ink },
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
              <Ionicons name={effectiveIconRight} size={icon.sm} color={semanticPalette.inkMuted} />
            ) : (
              effectiveIconRight
            )}
          </Pressable>
        ) : null}
      </Pressable>
      {errorText ? (
        <View style={styles.helperRow}>
          <Ionicons name="alert-circle" size={icon.tiny} color={semanticPalette.sale} />
          <Text style={[styles.helperText, { color: semanticPalette.sale }]} numberOfLines={2}>
            {errorText}
          </Text>
        </View>
      ) : helperText ? (
        <Text style={[styles.helperText, styles.helperTextNeutral, { color: semanticPalette.inkMuted }]} numberOfLines={2}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(semanticPalette, multiline, RADII) {
  return StyleSheet.create({
    wrap: {
      width: "100%",
    },
    field: {
      width: "100%",
      flexDirection: "row",
      alignItems: multiline ? "flex-start" : "center",
      borderWidth: 1,
      borderRadius: RADII.md,
      backgroundColor: semanticPalette.surfaceAlt,
      paddingHorizontal: spacing.md,
      minHeight: multiline ? 96 : 48,
      ...Platform.select({
        web: {
          transition: "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
        },
        default: {
          minHeight: multiline ? 92 : 46,
        },
      }),
    },
    fieldFocused: {
      ...Platform.select({
        web: {
          boxShadow:
            semanticPalette.mode === "dark"
              ? "0 0 0 3px rgba(255,255,255,0.10)"
              : "0 0 0 3px rgba(14,23,41,0.08)",
        },
        default: {},
      }),
    },
    fieldError: {
      ...Platform.select({
        web: {
          boxShadow: "0 0 0 2px rgba(178, 58, 58, 0.22)",
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
      minWidth: 0,
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
      lineHeight: lineHeight.body,
      paddingVertical: spacing.sm + 1,
      includeFontPadding: false,
      ...Platform.select({
        web: { outlineStyle: "none" },
        default: {
          paddingVertical: spacing.sm,
        },
      }),
    },
    inputWithLabel: {
      paddingTop: spacing.md + 2,
      paddingBottom: spacing.xs + 2,
    },
    inputMultiline: {
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
      textAlignVertical: "top",
      minHeight: spacing.xxl + spacing.md,
    },
    helperRow: {
      flexDirection: "row",
      alignItems: "flex-start",
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

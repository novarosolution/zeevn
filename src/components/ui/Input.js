import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { fonts, icon } from "../../theme/tokens";
import { inputOutlineWeb } from "../../theme/screenLayout";
import { useTheme } from "../../context/ThemeContext";
import useReducedMotion from "../../hooks/useReducedMotion";
import { nativeDriverEnabled } from "../../utils/motion";
import {
  InputFieldShell,
  textInputWebStyle,
  WebNativeTextInput,
  webDomInputStyle,
} from "./inputWebHelpers";
import { webZIndex } from "../../theme/webStacking";

const FOCUS_MS = 180;
const ERROR_SLOT_MIN = 20;

/**
 * Design-system text field: 40px row, surfaceAlt, ink focus ring (web).
 * Provide accessibilityLabel (or label) for VoiceOver.
 */
function InputBase({
  label,
  floatingLabel = false,
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder,
  helperText,
  errorText,
  secureTextEntry,
  editable = true,
  keyboardType,
  autoCapitalize,
  autoComplete,
  autoCorrect,
  autoFocus,
  maxLength,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  textContentType,
  inputMode,
  importantForAutofill,
  testID,
  style,
  inputStyle,
  accessibilityLabel,
  accessibilityHint,
  iconLeft,
  iconRight,
  onIconRightPress,
  passwordToggle = false,
  passwordShowA11yLabel = "Show password",
  passwordHideA11yLabel = "Hide password",
  inputRef: externalInputRef,
  errorId,
  describedBy,
  multiline,
  required = false,
}) {
  const { semanticPalette, RADII, TYPE } = useTheme();
  const reducedMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const focusAnim = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const errorTranslate = useRef(new Animated.Value(4)).current;
  const eyeHiddenOpacity = useRef(new Animated.Value(1)).current;
  const eyeVisibleOpacity = useRef(new Animated.Value(0)).current;
  const eyeRotate = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);
  const resolvedInputRef = externalInputRef ?? inputRef;
  const inputNativeId = testID || (label ? `input-${String(label).replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const resolvedErrorId = errorId === null ? undefined : errorId || (inputNativeId ? `${inputNativeId}-error` : undefined);

  const hasError = Boolean(errorText);
  const resolvedDescribedBy = useMemo(() => {
    const parts = [];
    if (describedBy) parts.push(describedBy);
    if (hasError && resolvedErrorId) parts.push(resolvedErrorId);
    return parts.length ? parts.join(" ") : undefined;
  }, [describedBy, hasError, resolvedErrorId]);
  const hasValue = value != null && String(value).length > 0;
  const showFloating = floatingLabel && (focused || hasValue);

  useEffect(() => {
    if (!floatingLabel) return;
    if (reducedMotion) {
      labelAnim.setValue(showFloating ? 1 : 0);
      return;
    }
    Animated.timing(labelAnim, {
      toValue: showFloating ? 1 : 0,
      duration: FOCUS_MS,
      useNativeDriver: false,
    }).start();
  }, [floatingLabel, labelAnim, reducedMotion, showFloating]);

  useEffect(() => {
    if (reducedMotion) {
      focusAnim.setValue(focused && !hasError ? 1 : 0);
      return;
    }
    Animated.timing(focusAnim, {
      toValue: focused && !hasError ? 1 : 0,
      duration: FOCUS_MS,
      useNativeDriver: false,
    }).start();
  }, [focusAnim, focused, hasError, reducedMotion]);

  useEffect(() => {
    if (passwordToggle) {
      if (reducedMotion) {
        eyeHiddenOpacity.setValue(hidden ? 1 : 0);
        eyeVisibleOpacity.setValue(hidden ? 0 : 1);
        eyeRotate.setValue(hidden ? 0 : 1);
        return;
      }
      Animated.parallel([
        Animated.timing(eyeHiddenOpacity, {
          toValue: hidden ? 1 : 0,
          duration: FOCUS_MS,
          useNativeDriver: nativeDriverEnabled,
        }),
        Animated.timing(eyeVisibleOpacity, {
          toValue: hidden ? 0 : 1,
          duration: FOCUS_MS,
          useNativeDriver: nativeDriverEnabled,
        }),
        Animated.timing(eyeRotate, {
          toValue: hidden ? 0 : 1,
          duration: FOCUS_MS,
          useNativeDriver: nativeDriverEnabled,
        }),
      ]).start();
    }
  }, [eyeHiddenOpacity, eyeRotate, eyeVisibleOpacity, hidden, passwordToggle, reducedMotion]);

  useEffect(() => {
    if (errorText) {
      if (reducedMotion) {
        errorOpacity.setValue(1);
        errorTranslate.setValue(0);
        return;
      }
      errorOpacity.setValue(0);
      errorTranslate.setValue(4);
      Animated.parallel([
        Animated.timing(errorOpacity, {
          toValue: 1,
          duration: FOCUS_MS,
          useNativeDriver: nativeDriverEnabled,
        }),
        Animated.timing(errorTranslate, {
          toValue: 0,
          duration: FOCUS_MS,
          useNativeDriver: nativeDriverEnabled,
        }),
      ]).start();
    } else {
      errorOpacity.setValue(0);
      errorTranslate.setValue(4);
    }
  }, [errorOpacity, errorText, errorTranslate, reducedMotion]);

  const a11yLabel = accessibilityLabel || label || placeholder || "Text input";

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [semanticPalette.lineSoft, semanticPalette.ink],
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: { width: "100%", ...webZIndex(1) },
        field: {
          minHeight: 40,
          borderRadius: RADII.md,
          borderWidth: 1,
          backgroundColor: semanticPalette.surfaceAlt,
          paddingHorizontal: 12,
          justifyContent: "center",
          ...Platform.select({
            web: {
              borderColor: hasError
                ? semanticPalette.sale
                : focused
                  ? semanticPalette.ink
                  : semanticPalette.lineSoft,
              transition: "border-color 0.18s ease, box-shadow 0.18s ease",
              ...(focused && !hasError ? { boxShadow: "0 0 0 3px rgba(14,23,41,0.08)" } : {}),
            },
            default: {},
          }),
        },
        fieldError: Platform.select({
          web: { boxShadow: `0 0 0 2px ${semanticPalette.sale}22` },
          default: {},
        }),
        innerRow: {
          flexDirection: "row",
          alignItems: "center",
          minHeight: 38,
          ...Platform.select({
            web: { pointerEvents: "auto" },
            default: {},
          }),
        },
        iconLeftWrap: {
          paddingRight: 8,
          justifyContent: "center",
        },
        iconRightWrap: {
          paddingLeft: 8,
          justifyContent: "center",
          width: 28,
          height: 28,
          alignItems: "center",
          ...webZIndex(5),
        },
        eyeStack: {
          width: icon.sm,
          height: icon.sm,
          alignItems: "center",
          justifyContent: "center",
        },
        eyeLayer: {
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
        },
        floatingWrap: {
          position: "relative",
          justifyContent: "center",
        },
        floatingLabel: {
          position: "absolute",
          left: 0,
          top: 0,
          fontFamily: fonts.medium,
          pointerEvents: "none",
        },
        input: {
          flex: 1,
          minWidth: 0,
          paddingVertical: Platform.OS === "ios" ? 10 : 8,
          fontFamily: fonts.regular,
          fontSize: Platform.select({ web: Math.max(16, Number(TYPE.body.fontSize || 16)), default: TYPE.body.fontSize }),
          lineHeight: TYPE.body.lineHeight,
          color: semanticPalette.ink,
          minHeight: 38,
          ...inputOutlineWeb,
        },
        inputFloated: {
          paddingTop: 14,
          paddingBottom: 6,
        },
        helper: {
          fontFamily: fonts.regular,
          fontSize: TYPE.caption.fontSize,
          lineHeight: TYPE.caption.lineHeight,
          color: semanticPalette.inkMuted,
        },
        errorSlot: {
          minHeight: ERROR_SLOT_MIN,
          marginTop: 4,
          overflow: "hidden",
          justifyContent: "flex-start",
        },
        disabled: { opacity: 0.5 },
      }),
    [
      RADII.md,
      TYPE.body.fontSize,
      TYPE.body.lineHeight,
      TYPE.caption.fontSize,
      TYPE.caption.lineHeight,
      focused,
      hasError,
      semanticPalette,
    ]
  );

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 8],
  });
  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [TYPE.body.fontSize, 11],
  });

  const eyeSpin = eyeRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const handleFocus = (e) => {
    setFocused(true);
    onFocus?.(e);
  };
  const handleBlur = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  const togglePassword = () => {
    if (Platform.OS === "ios") {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        /* noop */
      }
    }
    setHidden((h) => !h);
  };

  const wantsSecure = Boolean(secureTextEntry);
  const effectiveSecure = passwordToggle ? wantsSecure && hidden : wantsSecure;
  const effectiveOnRightPress = passwordToggle ? togglePassword : onIconRightPress;

  const glyphMuted = semanticPalette.inkMuted;
  const glyphActive = semanticPalette.ink;

  const fieldShellStyle = [
    styles.field,
    !editable ? { backgroundColor: semanticPalette.surfaceAlt, borderColor: semanticPalette.line } : null,
    hasError ? styles.fieldError : null,
    Platform.OS !== "web" && hasError ? { borderColor: semanticPalette.sale } : null,
  ];

  const animatedFieldStyle =
    Platform.OS !== "web" && !hasError
      ? { borderColor }
      : null;

  const webInputType =
    wantsSecure || passwordToggle
      ? hidden
        ? "password"
        : "text"
      : keyboardType === "email-address"
        ? "email"
        : "text";

  const webDomStyles = useMemo(
    () => [
      webDomInputStyle(semanticPalette, TYPE),
      floatingLabel && label ? styles.inputFloated : null,
      !editable ? { color: semanticPalette.inkSoft } : null,
      inputStyle,
    ],
    [TYPE, editable, floatingLabel, inputStyle, label, semanticPalette, styles]
  );

  const textControl =
    Platform.OS === "web" && !multiline ? (
      <WebNativeTextInput
        ref={resolvedInputRef}
        id={inputNativeId}
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={floatingLabel && label && !showFloating ? undefined : placeholder}
        type={webInputType}
        disabled={!editable}
        autoComplete={autoComplete}
        maxLength={maxLength}
        onEnterSubmit={
          returnKeyType === "go" || returnKeyType === "next" || returnKeyType === "done"
            ? onSubmitEditing
            : undefined
        }
        ariaDescribedBy={resolvedDescribedBy}
        ariaInvalid={hasError}
        ariaRequired={required}
        inputStyle={webDomStyles}
      />
    ) : (
      <TextInput
        ref={resolvedInputRef}
        value={value ?? ""}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={floatingLabel && label && !showFloating ? undefined : placeholder}
        placeholderTextColor={semanticPalette.inkMuted}
        secureTextEntry={effectiveSecure}
        multiline={multiline}
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
        importantForAutofill={importantForAutofill}
        testID={testID}
        accessibilityLabel={a11yLabel}
        accessibilityHint={accessibilityHint}
        accessibilityDescribedBy={resolvedDescribedBy}
        nativeID={inputNativeId}
        style={[
          styles.input,
          textInputWebStyle,
          floatingLabel && label ? styles.inputFloated : null,
          !editable ? { color: semanticPalette.inkSoft } : null,
          inputStyle,
        ]}
      />
    );

  const fieldBody = (
    <View style={[styles.innerRow, floatingLabel ? styles.floatingWrap : null]}>
      {iconLeft && !multiline ? (
        <View style={styles.iconLeftWrap}>
          {typeof iconLeft === "string" ? (
            <Ionicons name={iconLeft} size={icon.sm} color={focused ? glyphActive : glyphMuted} />
          ) : (
            iconLeft
          )}
        </View>
      ) : null}
      {floatingLabel && label ? (
        <Animated.Text
          style={[
            styles.floatingLabel,
            {
              color: hasError ? semanticPalette.sale : focused ? semanticPalette.ink : semanticPalette.inkMuted,
              top: labelTop,
              fontSize: labelFontSize,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Animated.Text>
      ) : null}
      {textControl}
      {passwordToggle && !multiline ? (
        <Pressable
          onPress={effectiveOnRightPress}
          style={({ pressed }) => [styles.iconRightWrap, pressed ? { opacity: 0.65 } : null]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={hidden ? passwordShowA11yLabel : passwordHideA11yLabel}
          accessibilityHint="Toggles password visibility"
          accessibilityState={{ selected: !hidden, disabled: false }}
        >
          <Animated.View style={[styles.eyeStack, { transform: [{ rotate: eyeSpin }] }]}>
            <Animated.View style={[styles.eyeLayer, { opacity: eyeHiddenOpacity }]}>
              <Ionicons name="eye-outline" size={icon.sm} color={glyphMuted} />
            </Animated.View>
            <Animated.View style={[styles.eyeLayer, { opacity: eyeVisibleOpacity }]}>
              <Ionicons name="eye-off-outline" size={icon.sm} color={glyphMuted} />
            </Animated.View>
          </Animated.View>
        </Pressable>
      ) : iconRight && !multiline ? (
        <Pressable
          onPress={effectiveOnRightPress}
          disabled={!effectiveOnRightPress}
          style={({ pressed }) => [styles.iconRightWrap, pressed ? { opacity: 0.65 } : null]}
          hitSlop={8}
          accessibilityRole={effectiveOnRightPress ? "button" : undefined}
        >
          {typeof iconRight === "string" ? (
            <Ionicons name={iconRight} size={icon.sm} color={glyphMuted} />
          ) : (
            iconRight
          )}
        </Pressable>
      ) : null}
    </View>
  );

  const FieldWrapper = Platform.OS !== "web" && !hasError ? Animated.View : View;

  return (
    <View style={[styles.wrap, style]}>
      {!floatingLabel && label ? (
        Platform.OS === "web" && inputNativeId ? (
          <label
            htmlFor={inputNativeId}
            style={{
              fontFamily: fonts.medium,
              fontSize: TYPE.small.fontSize,
              color: semanticPalette.inkSoft,
              marginBottom: 6,
              display: "block",
              cursor: "pointer",
            }}
          >
            {label}
            {required ? <span style={{ color: semanticPalette.sale }}> *</span> : null}
          </label>
        ) : (
          <Pressable
            onPress={() => resolvedInputRef.current?.focus?.()}
            accessibilityRole="text"
            accessibilityLabel={label}
          >
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: TYPE.small.fontSize,
                color: semanticPalette.inkSoft,
                marginBottom: 6,
              }}
            >
              {label}
              {required ? <Text style={{ color: semanticPalette.sale }}> *</Text> : null}
            </Text>
          </Pressable>
        )
      ) : null}
      <InputFieldShell
        editable={editable}
        onFocusField={() => resolvedInputRef.current?.focus?.()}
      >
        <FieldWrapper style={[fieldShellStyle, animatedFieldStyle]}>
          {fieldBody}
        </FieldWrapper>
      </InputFieldShell>
      <View style={styles.errorSlot}>
        {errorText ? (
          <Animated.Text
            nativeID={resolvedErrorId}
            style={[
              styles.helper,
              {
                color: semanticPalette.sale,
                opacity: errorOpacity,
                transform: [{ translateY: errorTranslate }],
              },
            ]}
            accessibilityLiveRegion="polite"
            {...(Platform.OS === "web" && resolvedErrorId ? { id: resolvedErrorId } : {})}
          >
            {errorText}
          </Animated.Text>
        ) : helperText ? (
          <Text style={styles.helper}>{helperText}</Text>
        ) : null}
      </View>
    </View>
  );
}

const Input = memo(InputBase);

export default Input;

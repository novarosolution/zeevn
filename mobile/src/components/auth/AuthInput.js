import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { AUTH_UI } from "../../content/appContent";
import { EASE_OUT, motionTiming } from "../../theme/motion";
import { inputOutlineWeb } from "../../theme/screenLayout";
import { useStoreTheme, withAlpha } from "../../theme/storefront";

/**
 * Login / Register field — a white card with a round icon tile, a small caps label above the value and a brand-green
 * edge when focused. `invalid` turns the edge red (the message itself lives in the form's error banner). `secure` adds
 * the show / hide eye. Forwards `focus()` so a field can hand focus to the next one.
 */
const AuthInput = forwardRef(function AuthInput(
  {
    label,
    value,
    onChangeText,
    placeholder,
    icon,
    secure = false,
    invalid = false,
    keyboardType,
    autoCapitalize,
    autoCorrect,
    autoComplete,
    textContentType,
    returnKeyType,
    onSubmitEditing,
    blurOnSubmit,
    editable = true,
    style,
  },
  ref
) {
  const { c, r, type, shadow, isDark } = useStoreTheme();
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);
  const focus = useSharedValue(0);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus?.(), blur: () => inputRef.current?.blur?.() }), []);

  const idle = invalid ? c.danger : c.lineStrong;
  const active = invalid ? c.danger : c.brand;
  const edge = useAnimatedStyle(() => ({ borderColor: interpolateColor(focus.value, [0, 1], [idle, active]) }), [idle, active]);

  const setFocus = (on) => {
    setFocused(on);
    focus.value = withTiming(on ? 1 : 0, { duration: motionTiming.toggle, easing: EASE_OUT });
  };

  const tint = invalid ? c.danger : focused ? c.brand : c.inkMute;
  const ring = Platform.select({
    web: { boxShadow: focused ? `0 0 0 4px ${withAlpha(invalid ? c.danger : c.brand, isDark ? 0.22 : 0.12)}` : "0 1px 2px rgba(61, 42, 18, 0.06)" },
    default: shadow.soft,
  });

  return (
    <Pressable onPress={() => inputRef.current?.focus?.()} accessible={false} style={style}>
      <Animated.View style={[styles.field, { borderRadius: r.xl - 4, backgroundColor: c.card }, edge, ring]}>
        <View style={[styles.tile, { backgroundColor: invalid ? c.dangerSoft : focused ? c.brandSoftStrong : c.soft }]}>
          <Ionicons name={icon} size={19} color={tint} />
        </View>

        <View style={styles.col}>
          <Text style={type.eyebrow(tint, 10.5)} numberOfLines={1}>
            {label}
          </Text>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            placeholder={placeholder}
            placeholderTextColor={withAlpha(c.inkMute, 0.62)}
            selectionColor={c.brand}
            cursorColor={c.brand}
            secureTextEntry={secure && hidden}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            autoComplete={autoComplete}
            textContentType={textContentType}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            blurOnSubmit={blurOnSubmit}
            editable={editable}
            accessibilityLabel={label}
            style={[styles.input, type.ui(16.5, "semibold", c.ink), inputOutlineWeb]}
          />
        </View>

        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            style={({ pressed }) => [styles.eye, pressed && { opacity: 0.55 }]}
            accessibilityRole="button"
            accessibilityLabel={hidden ? AUTH_UI.fields.showPassword : AUTH_UI.fields.hidePassword}
          >
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={21} color={c.inkMute} />
          </Pressable>
        ) : null}
      </Animated.View>
    </Pressable>
  );
});

export default AuthInput;

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 66,
    borderWidth: 1.5,
    paddingLeft: 12,
    paddingRight: 14,
    gap: 12,
  },
  tile: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  col: { flex: 1, minWidth: 0, gap: 2 },
  input: { padding: 0, margin: 0, minHeight: 24 },
  eye: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
});

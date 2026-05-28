import React, { forwardRef } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { fonts } from "../../theme/tokens";
import { webElevatedLayer, webZIndex } from "../../theme/webStacking";

/** DOM elements require a plain object for `style`, not an RN style array. */
export function flattenStyleForDom(style) {
  const flat = StyleSheet.flatten(style) || {};
  const out = {};
  for (const [key, value] of Object.entries(flat)) {
    if (value == null) continue;
    if (key === "paddingVertical") {
      out.paddingTop = value;
      out.paddingBottom = value;
      continue;
    }
    if (key === "paddingHorizontal") {
      out.paddingLeft = value;
      out.paddingRight = value;
      continue;
    }
    if (key === "textAlignVertical") continue;
    if (key === "textDecorationLine") {
      out.textDecoration = value;
      continue;
    }
    if (key === "lineHeight" && typeof value === "number") {
      out.lineHeight = `${value}px`;
      continue;
    }
    out[key] = value;
  }
  return out;
}

const WEB_BUTTON_STRIP_KEYS = new Set([
  "flex",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "height",
  "maxHeight",
  "minHeight",
  "alignSelf",
  "alignItems",
  "justifyContent",
  "flexDirection",
]);

/**
 * RN `borderRadius: 999` + flex stretch on web becomes giant pill blocks.
 * Lock pill height; allow flexGrow only for width in modal button rows.
 */
export function toWebButtonStyle(style, { fullWidth = false, minHeight = 42, borderRadius = 999 } = {}) {
  const flat = flattenStyleForDom(style);
  const pillRadius = Math.min(Number(borderRadius) || 999, Math.max(Math.ceil(minHeight / 2), 8));
  const wantsGrow = flat.flex === 1 || flat.flexGrow === 1;
  const safe = {};
  for (const [key, value] of Object.entries(flat)) {
    if (WEB_BUTTON_STRIP_KEYS.has(key)) continue;
    safe[key] = value;
  }

  return {
    ...safe,
    boxSizing: "border-box",
    display: fullWidth ? "flex" : "inline-flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: wantsGrow ? "1 0 auto" : "0 0 auto",
    flexGrow: wantsGrow ? 1 : 0,
    flexShrink: 0,
    flexBasis: "auto",
    width: fullWidth ? "100%" : safe.width,
    maxWidth: "100%",
    minHeight,
    height: minHeight,
    maxHeight: minHeight,
    alignSelf: "flex-start",
    borderRadius: pillRadius,
    margin: safe.margin ?? 0,
    overflow: "hidden",
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  };
}

/** Web-safe styles for RN TextInput (native/mobile). */
export const textInputWebStyle = Platform.select({
  web: {
    outlineStyle: "none",
    outlineWidth: 0,
    flex: 1,
    minWidth: 0,
    width: "100%",
  },
  default: {},
});

export function webDomInputStyle(semanticPalette, TYPE) {
  const bodySize = Number(TYPE?.body?.fontSize || 16);
  return {
    flex: 1,
    minWidth: 0,
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontFamily: fonts.regular,
    fontSize: Math.max(16, bodySize),
    lineHeight: `${TYPE.body.lineHeight}px`,
    color: semanticPalette.ink,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 0,
    paddingRight: 0,
    margin: 0,
    boxSizing: "border-box",
    position: "relative",
    zIndex: 1,
    WebkitAppearance: "none",
    MozAppearance: "none",
    appearance: "none",
  };
}

/**
 * Real HTML input for web — avoids RN Web TextInput focus/typing bugs inside Pressable layouts.
 */
export const WebNativeTextInput = forwardRef(function WebNativeTextInput(
  {
    id,
    testID,
    value,
    onChangeText,
    onFocus,
    onBlur,
    placeholder,
    type = "text",
    disabled = false,
    autoComplete,
    maxLength,
    onEnterSubmit,
    ariaDescribedBy,
    ariaInvalid,
    ariaRequired,
    inputStyle,
  },
  ref
) {
  if (Platform.OS !== "web") return null;

  return (
    <input
      ref={ref}
      id={id}
      data-testid={testID}
      type={type}
      value={value ?? ""}
      disabled={disabled}
      readOnly={disabled}
      placeholder={placeholder}
      autoComplete={autoComplete}
      maxLength={maxLength}
      onChange={(e) => onChangeText?.(e.target.value)}
      onFocus={(e) => onFocus?.(e)}
      onBlur={(e) => onBlur?.(e)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onEnterSubmit) {
          e.preventDefault();
          onEnterSubmit();
        }
      }}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid || undefined}
      aria-required={ariaRequired || undefined}
      style={flattenStyleForDom(inputStyle)}
    />
  );
});

/**
 * On native, tap the field chrome to focus. On web, use a plain View (no Pressable).
 */
export function InputFieldShell({ editable = true, onFocusField, children }) {
  if (Platform.OS === "web") {
    return (
      <View
        dataSet={{ zvElevated: "true" }}
        style={[{ width: "100%" }, webElevatedLayer(5)]}
      >
        {children}
      </View>
    );
  }
  return (
    <Pressable onPress={onFocusField} disabled={!editable} style={{ width: "100%" }}>
      {children}
    </Pressable>
  );
}

/**
 * Real HTML button for web — Reanimated Pressable often fails to receive clicks in auth layouts.
 */
export function WebNativeButton({
  onPress,
  disabled = false,
  loading = false,
  testID,
  ariaLabel,
  style,
  contentStyle,
  fullWidth = false,
  minHeight = 42,
  borderRadius = 999,
  children,
}) {
  if (Platform.OS !== "web") return null;

  const isDisabled = disabled || loading;
  const domStyle = toWebButtonStyle(style, { fullWidth, minHeight, borderRadius });

  return (
    <button
      type="button"
      data-testid={testID}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      disabled={isDisabled}
      data-zv-button="true"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDisabled && onPress) onPress(e);
      }}
      style={flattenStyleForDom([webZIndex(2), domStyle])}
      className="zv-web-button"
    >
      <span
        style={flattenStyleForDom([
          {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            flex: "0 0 auto",
            height: "auto",
            maxHeight: "100%",
            overflow: "hidden",
          },
          contentStyle,
        ])}
      >
        {children}
      </span>
    </button>
  );
}

/** Text-styled native button for inline links (Forgot password, Register, etc.). */
export function WebTextLink({ onPress, disabled, style, children, ariaLabel }) {
  if (Platform.OS !== "web") return null;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && onPress) onPress(e);
      }}
      className="zv-web-text-link"
      style={flattenStyleForDom([
        webZIndex(2),
        {
          flex: "0 0 auto",
          height: "auto",
          width: "auto",
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: disabled ? "default" : "pointer",
          font: "inherit",
          textAlign: "inherit",
        },
        style,
      ])}
    >
      {children}
    </button>
  );
}

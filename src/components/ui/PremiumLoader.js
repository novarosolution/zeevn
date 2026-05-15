import React, { memo, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { APP_LOADING_UI } from "../../content/appContent";
import { useTheme } from "../../context/ThemeContext";
import { fonts, spacing } from "../../theme/tokens";
import ProgressRing from "../feedback/ProgressRing";

const SIZE_TOKENS = {
  sm: { ring: "sm", captionSize: 12, hintSize: 11, gap: 12 },
  md: { ring: "md", captionSize: 14, hintSize: 11, gap: 12 },
  lg: { ring: "lg", captionSize: 14, hintSize: 11, gap: 12 },
  inline: { ring: "sm", captionSize: 13, hintSize: 11, gap: 8 },
};

function TimeoutNotice({ title, body, retryLabel, onRetry, c }) {
  return (
    <Animated.View entering={FadeIn.duration(220)} style={[styles.timeoutWrap, { borderColor: c.border, backgroundColor: c.surface }]}>
      <Text style={[styles.timeoutTitle, { color: c.textPrimary }]}>{title}</Text>
      <Text style={[styles.timeoutBody, { color: c.textSecondary }]}>{body}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel={retryLabel} style={({ pressed }) => [styles.retryBtn, pressed ? styles.retryPressed : null]}>
          <Text style={[styles.retryText, { color: c.primary }]}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

function PremiumLoaderBase({
  size = "md",
  caption,
  hint = null,
  inline = false,
  fullscreen = false,
  onRetry,
  style,
}) {
  const { colors: c } = useTheme();
  const effectiveSizeKey = inline ? "inline" : size;
  const tokens = SIZE_TOKENS[effectiveSizeKey] || SIZE_TOKENS.md;
  const resolvedCaption = caption || APP_LOADING_UI.inline.default;
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (!fullscreen) {
      setShowTimeout(false);
      return undefined;
    }
    const timer = setTimeout(() => setShowTimeout(true), 8000);
    return () => clearTimeout(timer);
  }, [fullscreen]);

  const localStyles = useMemo(() => createStyles(c, inline), [c, inline]);

  const loaderCore = (
    <View
      style={[localStyles.wrap, inline ? localStyles.wrapInline : localStyles.wrapBlock, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={resolvedCaption}
      accessibilityHint={hint || undefined}
      accessibilityValue={{ text: resolvedCaption }}
    >
      <ProgressRing size={tokens.ring} accessibilityValueText={resolvedCaption} accessible={false} />
      <View style={[localStyles.copy, { marginTop: inline ? 0 : tokens.gap, marginLeft: inline ? tokens.gap : 0 }]}>
        <Text style={[localStyles.caption, { color: c.textSecondary, fontSize: tokens.captionSize }]}>{resolvedCaption}</Text>
        {hint ? <Text style={[localStyles.hint, { color: c.textMuted, fontSize: tokens.hintSize }]}>{hint}</Text> : null}
      </View>
    </View>
  );

  if (!fullscreen) return loaderCore;

  return (
    <View style={[styles.fullscreenWrap, { backgroundColor: c.background }]}>
      {loaderCore}
      {showTimeout ? (
        <TimeoutNotice
          title={APP_LOADING_UI.errors.timeoutTitle}
          body={APP_LOADING_UI.errors.timeoutBody}
          retryLabel={APP_LOADING_UI.errors.retry}
          onRetry={onRetry}
          c={c}
        />
      ) : null}
    </View>
  );
}

function createStyles(c, inline) {
  return StyleSheet.create({
    wrap: {
      justifyContent: "center",
    },
    wrapInline: {
      flexDirection: "row",
      alignItems: "center",
      minWidth: 0,
    },
    wrapBlock: {
      alignItems: "center",
      alignSelf: "center",
      width: "100%",
      maxWidth: 420,
      paddingVertical: spacing.lg,
    },
    copy: {
      minWidth: 0,
      alignItems: inline ? "flex-start" : "center",
      gap: 4,
    },
    caption: {
      fontFamily: fonts.medium,
      textAlign: inline ? "left" : "center",
    },
    hint: {
      fontFamily: fonts.regular,
      textAlign: inline ? "left" : "center",
      maxWidth: inline ? undefined : 340,
    },
  });
}

const styles = StyleSheet.create({
  fullscreenWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  timeoutWrap: {
    marginTop: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 360,
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0 6px 16px rgba(0,0,0,0.06)" },
      default: {},
    }),
  },
  timeoutTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    textAlign: "center",
  },
  timeoutBody: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 11,
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  retryPressed: {
    opacity: 0.72,
  },
  retryText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
});

const PremiumLoader = memo(PremiumLoaderBase);

export default PremiumLoader;

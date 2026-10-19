/**
 * Storefront UI kit for the app's inner screens (settings, inbox, support, profile editing, addresses, rewards…).
 * Small, themed building blocks with the same look and motion as Home / Shop / Account: soft white cards, olive and
 * ghee-gold accents, springy presses with a haptic tick, and entrances that honour "Reduce Motion".
 */
import React, { Children, Fragment, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useStoreTheme, withAlpha } from "../../theme/storefront";
import { hapticTap, hapticTick } from "../../utils/haptics";
import PressableScale from "./PressableScale";
import StoreIcon from "./StoreIcon";

const toIcon = (icon) => (typeof icon === "string" ? { ion: icon } : icon);

/* ---------------------------------------------------------------------------------------------- motion */

/** Fades and rises into place on mount. `index` staggers siblings (capped so long lists do not drag). */
export function Rise({ index = 0, step = 55, children, style, ...rest }) {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <View style={style} {...rest}>
        {children}
      </View>
    );
  }
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 9) * step).duration(440).easing(Easing.out(Easing.cubic))}
      style={style}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}

/** Slow idle bob for hero icons — a wrapper-view transform only (cheap); holds still with Reduce Motion. */
export function Float({ children, amplitude = 5, duration = 1700, style }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduced) return undefined;
    y.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(amplitude, { duration, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    return undefined;
  }, [amplitude, duration, reduced, y]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/* ---------------------------------------------------------------------------------------------- surfaces */

/** White rounded card with a soft shadow. Pass `onPress` to make the whole card a springy button. */
export function Card({ children, style, onPress, padded = true, tone = "default", ...rest }) {
  const { c, r, shadow } = useStoreTheme();
  const base = [
    styles.card,
    shadow.soft,
    { backgroundColor: tone === "soft" ? c.cardSoft : c.card, borderColor: c.line, borderRadius: r.xl },
    padded && styles.cardPad,
    style,
  ];
  if (onPress) {
    return (
      <PressableScale onPress={onPress} scaleTo={0.985} style={base} {...rest}>
        {children}
      </PressableScale>
    );
  }
  return (
    <View style={base} {...rest}>
      {children}
    </View>
  );
}

/** Small tracked caps label above a block. */
export function SectionLabel({ children, style }) {
  const { c, type } = useStoreTheme();
  return <Text style={[type.ui(12.5, "bold", c.inkMute, { letterSpacing: 1.1 }), styles.sectionLabel, style]}>{children}</Text>;
}

/** A card of rows, hairline-separated. */
export function Group({ children, style }) {
  const { c, r, shadow } = useStoreTheme();
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[shadow.soft, { backgroundColor: c.card, borderRadius: r.xl }, style]}>
      <View style={[styles.group, { borderColor: c.line, borderRadius: r.xl }]}>
        {items.map((child, i) => (
          <Fragment key={child.key ?? i}>
            {i > 0 ? <View style={[styles.divider, { backgroundColor: c.line }]} /> : null}
            {child}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

/**
 * List row: tinted icon bubble, title (+ optional subtitle), trailing slot and chevron.
 * `tone="danger"` paints it red (sign out, delete).
 */
export function Row({ icon, title, subtitle, trailing, onPress, tone = "default", chevron, disabled, badge }) {
  const { c, type } = useStoreTheme();
  const danger = tone === "danger";
  const color = danger ? c.danger : c.ink;
  const showChevron = chevron ?? Boolean(onPress);
  const content = (
    <>
      {icon ? (
        <View style={[styles.bubble, { backgroundColor: danger ? c.dangerSoft : c.soft }]}>
          <StoreIcon icon={toIcon(icon)} size={20} color={color} />
        </View>
      ) : null}
      <View style={styles.rowText}>
        <Text style={type.ui(16, "medium", color)} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={type.ui(12.5, "medium", c.inkMute)} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: c.brandSoft }]}>
          <Text style={type.ui(12.5, "extrabold", c.brand)}>{badge}</Text>
        </View>
      ) : null}
      {typeof trailing === "string" ? <Text style={type.ui(13.5, "semibold", c.inkMute)}>{trailing}</Text> : trailing}
      {showChevron ? <Ionicons name="chevron-forward" size={17} color={c.inkMute} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <PressableScale
      onPress={() => {
        hapticTick();
        onPress();
      }}
      scaleTo={0.985}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[styles.row, disabled && { opacity: 0.5 }]}
    >
      {content}
    </PressableScale>
  );
}

/* ---------------------------------------------------------------------------------------------- controls */

/** Segmented picker whose thumb glides between options. options: [{ key, label, icon? }] */
export function Segmented({ options, value, onChange }) {
  const { c, r, type, shadow } = useStoreTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const seg = width ? (width - 8) / options.length : 0;
  const x = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    if (!seg) return;
    if (!placed.current) {
      placed.current = true;
      x.value = index * seg;
      return;
    }
    x.value = withSpring(index * seg, { damping: 20, stiffness: 280, mass: 0.7 });
  }, [index, seg, x]);

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.segment, { backgroundColor: c.soft, borderRadius: r.lg }]}
      accessibilityRole="radiogroup"
    >
      {seg ? <Animated.View style={[styles.thumb, shadow.soft, { width: seg, backgroundColor: c.card, borderRadius: r.md }, thumb]} /> : null}
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => {
              if (!active) hapticTick();
              onChange?.(option.key);
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={styles.segItem}
          >
            {option.icon ? <StoreIcon icon={toIcon(option.icon)} size={17} color={active ? c.brand : c.inkSoft} /> : null}
            <Text style={type.ui(13.5, active ? "extrabold" : "semibold", active ? c.brand : c.inkSoft)}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** iOS-style switch with a springy thumb and an olive track. */
export function Toggle({ value, onValueChange, disabled, label }) {
  const { c } = useStoreTheme();
  const progress = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, { damping: 16, stiffness: 300, mass: 0.7 });
  }, [value, progress]);
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(progress.value, [0, 1], [c.softStrong, c.brand]) }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: progress.value * 20 }] }));
  return (
    <Pressable
      onPress={() => {
        hapticTick();
        onValueChange?.(!value);
      }}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: Boolean(value), disabled: Boolean(disabled) }}
      style={disabled ? { opacity: 0.5 } : null}
    >
      <Animated.View style={[styles.track, track]}>
        <Animated.View style={[styles.knob, thumb]} />
      </Animated.View>
    </Pressable>
  );
}

/** Pill button. tone: primary (olive gradient) · secondary (olive tint) · danger (red tint) · ghost. */
export function Button({ label, icon, onPress, loading = false, disabled = false, tone = "primary", compact = false, style }) {
  const { c, type, shadow, isDark } = useStoreTheme();
  const height = compact ? 44 : 54;
  const inactive = disabled || loading;
  const palette = {
    primary: { text: isDark ? "#18200C" : "#FFFFFF" },
    secondary: { bg: c.brandSoft, text: c.brand, border: c.brandAlt },
    danger: { bg: c.dangerSoft, text: c.danger, border: withAlpha(c.danger, 0.4) },
    ghost: { bg: "transparent", text: c.ink, border: c.line },
  }[tone];
  const gradient = isDark ? ["#C9DA8C", "#9DB45B"] : ["#4C7138", "#244424"];

  return (
    <PressableScale
      onPress={() => {
        if (inactive) return;
        hapticTap();
        onPress?.();
      }}
      scaleTo={0.97}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.button,
        { height, borderRadius: height / 2 },
        tone === "primary" ? shadow.card : null,
        tone !== "primary" && { backgroundColor: palette.bg, borderColor: palette.border, borderWidth: 1.5 },
        inactive && { opacity: loading ? 0.85 : 0.5 },
        style,
      ]}
    >
      {tone === "primary" ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <>
          {icon ? <StoreIcon icon={toIcon(icon)} size={19} color={palette.text} /> : null}
          <Text style={type.ui(compact ? 14.5 : 16, "extrabold", palette.text, { letterSpacing: 0.2 })} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </PressableScale>
  );
}

/** Filter chip. */
export function Chip({ label, selected, onPress, count }) {
  const { c, type } = useStoreTheme();
  return (
    <PressableScale
      onPress={() => {
        if (!selected) hapticTick();
        onPress?.();
      }}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      style={[
        styles.chip,
        selected ? { backgroundColor: c.brand, borderColor: c.brand } : { backgroundColor: c.card, borderColor: c.line },
      ]}
    >
      <Text style={type.ui(13.5, selected ? "extrabold" : "semibold", selected ? c.onBrand : c.inkSoft)}>{label}</Text>
      {count ? (
        <View style={[styles.chipCount, { backgroundColor: selected ? withAlpha(c.onBrand, 0.2) : c.soft }]}>
          <Text style={type.ui(11.5, "extrabold", selected ? c.onBrand : c.inkSoft)}>{count}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

/* ---------------------------------------------------------------------------------------------- content */

/** Circular avatar — photo when there is one, otherwise the initial on an olive gradient. */
export function Avatar({ name, uri, size = 56 }) {
  const { isDark, type } = useStoreTheme();
  const initial = String(name || "Z").trim().charAt(0).toUpperCase() || "Z";
  const colors = isDark ? ["#C9DA8C", "#9DB45B"] : ["#4C7138", "#244424"];
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={160} />
      ) : (
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarFill}>
          <Text style={type.display(size * 0.42, { color: isDark ? "#18200C" : "#FFFFFF", ls: 0 })}>{initial}</Text>
        </LinearGradient>
      )}
    </View>
  );
}

/** Centred empty state: floating icon, a short title, one line of body and an optional action. */
export function EmptyState({ icon = "sparkles-outline", title, body, actionLabel, onAction }) {
  const { c, type } = useStoreTheme();
  return (
    <Rise>
      <View style={styles.empty}>
        <Float>
          <View style={[styles.emptyIcon, { backgroundColor: c.brandSoft, borderColor: withAlpha(c.brandAlt, 0.25) }]}>
            <StoreIcon icon={toIcon(icon)} size={38} color={c.brand} />
          </View>
        </Float>
        <Text style={[type.display(24, { semi: true, ls: -0.4 }), styles.emptyTitle]}>{title}</Text>
        {body ? <Text style={[type.ui(14.5, "medium", c.inkMute), styles.emptyBody]}>{body}</Text> : null}
        {actionLabel ? (
          <View style={styles.emptyAction}>
            <Button label={actionLabel} onPress={onAction} compact tone="secondary" />
          </View>
        ) : null}
      </View>
    </Rise>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth },
  cardPad: { padding: 16 },
  sectionLabel: { textTransform: "uppercase", marginBottom: 10, marginLeft: 4 },
  group: { borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 66 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 13, minHeight: 64 },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  bubble: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  badge: { minWidth: 26, height: 26, paddingHorizontal: 8, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  segment: { flexDirection: "row", padding: 4 },
  thumb: { position: "absolute", top: 4, bottom: 4, left: 4 },
  segItem: { flex: 1, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  track: { width: 50, height: 30, borderRadius: 15, padding: 3 },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, paddingHorizontal: 24 },
  chip: { flexDirection: "row", alignItems: "center", gap: 8, height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  chipCount: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  avatar: { overflow: "hidden" },
  avatarFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 44, paddingHorizontal: 28, gap: 10 },
  emptyIcon: { width: 92, height: 92, borderRadius: 46, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 6 },
  emptyTitle: { textAlign: "center" },
  emptyBody: { textAlign: "center", maxWidth: 290 },
  emptyAction: { marginTop: 10, alignSelf: "stretch" },
});

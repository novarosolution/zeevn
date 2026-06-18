import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "./ThemeContext";
import useReducedMotion from "../hooks/useReducedMotion";
import { ALCHEMY } from "../theme/customerAlchemy";
import { KANKREG_PALETTE } from "../theme/kankregWeb";
import { fonts, icon, radius, spacing, typography } from "../theme/tokens";
import { platformShadow } from "../theme/shadowPlatform";
import { getKankregChromeTop } from "../theme/kankregChrome";

const ToastContext = createContext(undefined);

const TOAST_TOKENS = {
  success: {
    iconName: "checkmark-circle",
    accent: KANKREG_PALETTE.greenDeep,
    accentBright: KANKREG_PALETTE.greenBright,
    iconGradient: [ALCHEMY.goldBright, ALCHEMY.gold, ALCHEMY.goldDeep],
    iconColor: "#FFFCF8",
    progress: KANKREG_PALETTE.greenBright,
  },
  cart: {
    iconName: "bag-check",
    accent: KANKREG_PALETTE.greenDeep,
    accentBright: ALCHEMY.goldBright,
    iconGradient: [KANKREG_PALETTE.greenBright, KANKREG_PALETTE.green, KANKREG_PALETTE.greenDeep],
    iconColor: "#FFFCF8",
    borderTop: ALCHEMY.gold,
    progress: ALCHEMY.gold,
  },
  error: {
    iconName: "alert-circle",
    accent: KANKREG_PALETTE.danger,
    accentBright: "#E85D4A",
    iconGradient: ["#E85D4A", KANKREG_PALETTE.danger, "#8B2E1F"],
    iconColor: "#FFFCF8",
    progress: KANKREG_PALETTE.danger,
  },
  warning: {
    iconName: "warning",
    accent: ALCHEMY.goldDeep,
    accentBright: ALCHEMY.goldBright,
    iconGradient: [ALCHEMY.goldBright, ALCHEMY.gold, ALCHEMY.brown],
    iconColor: ALCHEMY.brownInk,
    progress: ALCHEMY.gold,
  },
  info: {
    iconName: "information-circle",
    accent: KANKREG_PALETTE.greenDeep,
    accentBright: KANKREG_PALETTE.greenBright,
    iconGradient: [KANKREG_PALETTE.greenBright, KANKREG_PALETTE.green, KANKREG_PALETTE.greenDeep],
    iconColor: "#FFFCF8",
    progress: KANKREG_PALETTE.green,
  },
};

const DEFAULT_DURATION = 2600;
const CART_DURATION = 1900;
const MAX_VISIBLE = 3;
let toastSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (input) => {
      const opts = typeof input === "string" ? { message: input } : input || {};
      const id = ++toastSeq;
      const intent = opts.intent === "cart" ? "cart" : "default";
      const duration = opts.duration ?? (intent === "cart" ? CART_DURATION : DEFAULT_DURATION);
      const type = intent === "cart" ? "cart" : TOAST_TOKENS[opts.type] ? opts.type : "info";
      const toast = {
        id,
        message: String(opts.message ?? ""),
        title: opts.title ? String(opts.title) : "",
        type,
        intent,
        compact: opts.compact !== false,
        duration,
        createdAt: Date.now(),
      };
      setToasts((current) => {
        const next = [...current, toast];
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      });
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      dismissToast: dismiss,
      toastSuccess: (message, opts) => showToast({ ...opts, message, type: "success" }),
      toastError: (message, opts) => showToast({ ...opts, message, type: "error" }),
      toastInfo: (message, opts) => showToast({ ...opts, message, type: "info" }),
      toastWarning: (message, opts) => showToast({ ...opts, message, type: "warning" }),
      toastCart: (message, opts) =>
        showToast({ ...opts, message, type: "cart", intent: "cart", compact: true }),
    }),
    [showToast, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastHost({ toasts, onDismiss }) {
  const insets = useSafeAreaInsets();
  if (toasts.length === 0) return null;
  const topOffset =
    Platform.OS === "web"
      ? getKankregChromeTop(insets) + 10
      : Math.max(insets.top, spacing.sm) + spacing.xs;

  return (
    <View style={[styles.host, { paddingTop: topOffset }]} pointerEvents="box-none">
      {toasts.map((toast, idx) => (
        <ToastItem key={toast.id} toast={toast} stackIndex={idx} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

function ToastProgressBar({ duration, color, reducedMotion }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion || duration <= 0 || trackWidth <= 0) return;
    progress.value = 1;
    progress.value = withTiming(0, {
      duration,
      easing: Easing.linear,
    });
  }, [duration, progress, reducedMotion, trackWidth]);

  const barStyle = useAnimatedStyle(() => ({
    width: Math.max(trackWidth * progress.value, 0),
  }));

  if (reducedMotion || duration <= 0) return null;

  return (
    <View
      style={styles.progressTrack}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.progressFill, { backgroundColor: color }, barStyle]} />
    </View>
  );
}

function ToastItem({ toast, stackIndex, onDismiss }) {
  const { colors: c, isDark } = useTheme();
  const reducedMotion = useReducedMotion();
  const tok = TOAST_TOKENS[toast.type] || TOAST_TOKENS.info;
  const isCart = toast.intent === "cart";
  const styles2 = useMemo(() => createToastStyles(c, isDark, tok, isCart), [c, isDark, tok, isCart]);

  const label = isCart
    ? toast.message
    : toast.title && toast.message
      ? `${toast.title} — ${toast.message}`
      : toast.title || toast.message;

  const entering = reducedMotion
    ? undefined
    : isCart
      ? SlideInRight.delay(stackIndex * 40)
          .springify()
          .damping(22)
          .stiffness(320)
          .mass(0.65)
      : FadeInDown.delay(stackIndex * 45)
          .springify()
          .damping(22)
          .stiffness(300)
          .mass(0.65);

  return (
    <Animated.View
      entering={entering}
      exiting={reducedMotion ? undefined : FadeOutUp.duration(180)}
      layout={reducedMotion ? undefined : LinearTransition.springify().damping(22)}
      style={styles2.wrap}
      pointerEvents="auto"
      accessibilityLiveRegion="polite"
      accessibilityRole={toast.type === "error" ? "alert" : undefined}
    >
      <LinearGradient
        colors={[tok.borderTop || tok.accentBright, tok.accentBright, tok.borderTop || tok.accent]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles2.topAccent}
        pointerEvents="none"
      />

      <View style={styles2.row}>
        <Pressable
          onPress={() => onDismiss(toast.id)}
          style={({ pressed, hovered }) => [
            styles2.mainTap,
            pressed ? styles2.mainTapPressed : null,
            hovered && Platform.OS === "web" ? styles2.mainTapHover : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Dismiss: ${label}`}
        >
          <LinearGradient
            colors={tok.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles2.iconRing}
          >
            <Ionicons name={tok.iconName} size={isCart ? 13 : 14} color={tok.iconColor} />
          </LinearGradient>

          <Text style={styles2.label} numberOfLines={2}>
            {label}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onDismiss(toast.id)}
          hitSlop={8}
          style={({ pressed, hovered }) => [
            styles2.closeBtn,
            pressed ? styles2.closeBtnPressed : null,
            hovered && Platform.OS === "web" ? styles2.closeBtnHover : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
        >
          <Ionicons name="close" size={12} color={c.textMuted} />
        </Pressable>
      </View>

      <ToastProgressBar duration={toast.duration} color={tok.progress} reducedMotion={reducedMotion} />
    </Animated.View>
  );
}

function createToastStyles(c, isDark, tok, isCart) {
  const wrapShadow = platformShadow({
    web: {
      boxShadow: isDark
        ? "0 10px 28px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.05)"
        : "0 10px 26px rgba(22, 69, 51, 0.12), inset 0 1px 0 rgba(255,255,255,0.96)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
    },
    ios: {
      shadowColor: isDark ? "#000000" : "#3D2A12",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.34 : 0.12,
      shadowRadius: 14,
    },
    android: { elevation: 5 },
  });

  return StyleSheet.create({
    wrap: {
      width: "auto",
      maxWidth: isCart ? 300 : 340,
      minWidth: 0,
      alignSelf: Platform.OS === "web" ? "flex-end" : "center",
      marginBottom: spacing.xs + 2,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(22, 69, 51, 0.1)",
      backgroundColor: isDark ? "rgba(24, 22, 20, 0.94)" : "rgba(255, 253, 249, 0.97)",
      overflow: "hidden",
      ...wrapShadow,
    },
    topAccent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 1.5,
      opacity: 0.9,
      zIndex: 2,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 2,
      minHeight: isCart ? 36 : 40,
    },
    mainTap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs + 2,
      paddingVertical: spacing.xs + 3,
      paddingLeft: spacing.sm + 2,
      paddingRight: spacing.xs,
      minWidth: 0,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    mainTapPressed: {
      opacity: 0.92,
    },
    mainTapHover: {
      ...Platform.select({
        web: { opacity: 0.9 },
        default: {},
      }),
    },
    iconRing: {
      width: isCart ? 24 : 26,
      height: isCart ? 24 : 26,
      borderRadius: isCart ? 12 : 13,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    label: {
      flex: 1,
      minWidth: 0,
      fontFamily: fonts.semibold,
      fontSize: isCart ? typography.caption : typography.caption + 0.5,
      lineHeight: isCart ? 16 : 17,
      color: c.textPrimary,
      letterSpacing: 0.05,
    },
    closeBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.xs,
      flexShrink: 0,
      ...Platform.select({ web: { cursor: "pointer" }, default: {} }),
    },
    closeBtnPressed: {
      opacity: 0.6,
    },
    closeBtnHover: {
      ...Platform.select({
        web: {
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(22, 69, 51, 0.06)",
        },
        default: {},
      }),
    },
  });
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: spacing.sm + 4,
    alignItems: Platform.OS === "web" ? "flex-end" : "stretch",
    justifyContent: "flex-start",
    zIndex: 9999,
    ...Platform.select({
      web: { position: "fixed", pointerEvents: "none" },
      default: {},
    }),
  },
  progressTrack: {
    height: 2,
    backgroundColor: "rgba(127, 127, 127, 0.1)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
});

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return ctx;
}

/** Safe variant: returns a no-op API if no provider is mounted (e.g. early boot). */
export function useToastSafe() {
  const ctx = useContext(ToastContext);
  return ctx || NOOP_TOAST;
}

const NOOP_TOAST = {
  showToast: () => 0,
  dismissToast: () => {},
  toastSuccess: () => 0,
  toastError: () => 0,
  toastInfo: () => 0,
  toastWarning: () => 0,
  toastCart: () => 0,
};

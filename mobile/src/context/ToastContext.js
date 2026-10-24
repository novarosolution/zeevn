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
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  FadeInUp,
  FadeOutDown,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { EASE_OUT, motionSettle, motionTiming, rubberband } from "../theme/motion";
import { STORE_NAV_HEIGHT, useStoreTheme, withAlpha } from "../theme/storefront";
import useReducedMotion from "../hooks/useReducedMotion";

const ToastContext = createContext(undefined);

const ICONS = {
  success: "checkmark",
  cart: "bag-handle",
  error: "close",
  warning: "warning",
  info: "information-circle",
};

const DEFAULT_DURATION = 2800;
const MAX_VISIBLE = 2;
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
      const type = ICONS[opts.type] ? opts.type : "info";
      const duration = opts.duration ?? DEFAULT_DURATION;
      const toast = {
        id,
        message: String(opts.message ?? ""),
        title: opts.title ? String(opts.title) : "",
        type,
        duration,
      };
      setToasts((current) => {
        const next = [...current, toast];
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      });
      if (duration > 0) {
        timersRef.current.set(id, setTimeout(() => dismiss(id), duration));
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
      toastCart: () => 0,
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

  const dock = Math.max(16, (insets.bottom || 0) + 6);
  const bottom = Platform.OS === "web" ? Math.max(24, insets.bottom + 20) : dock + STORE_NAV_HEIGHT + 10;

  return (
    <View style={[styles.host, { paddingBottom: bottom }]} pointerEvents="box-none">
      <GestureHandlerRootView style={styles.stack} pointerEvents="box-none">
        {toasts.map((toast, idx) => (
          <ToastItem key={toast.id} toast={toast} stackIndex={idx} onDismiss={onDismiss} />
        ))}
      </GestureHandlerRootView>
    </View>
  );
}

function toastAccent(c, type) {
  if (type === "error") return { bg: c.danger, fg: "#FFFCF8" };
  if (type === "warning") return { bg: c.gold, fg: c.ink };
  if (type === "cart") return { bg: c.goldSoft, fg: c.goldText };
  return { bg: c.brand, fg: c.onBrand };
}

function ToastItem({ toast, stackIndex, onDismiss }) {
  const { c, isDark, type: typo, shadow } = useStoreTheme();
  const reducedMotion = useReducedMotion();
  const accent = toastAccent(c, toast.type);
  const dragY = useSharedValue(0);

  const title = toast.title || toast.message;
  const detail = toast.title ? toast.message : "";
  const label = detail ? `${title}. ${detail}` : title;

  const dismissThis = useCallback(() => onDismiss(toast.id), [onDismiss, toast.id]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(8)
        .onUpdate((e) => {
          const y = e.translationY;
          dragY.value = y > 0 ? y : rubberband(y, 72, 0.55);
        })
        .onEnd((e) => {
          if (e.translationY > 36 || e.velocityY > 700) {
            runOnJS(dismissThis)();
            return;
          }
          dragY.value = withSpring(0, motionSettle.settle);
        }),
    [dismissThis, dragY]
  );

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
    opacity: 1 - Math.min(dragY.value, 80) / 140,
  }));

  const entering = reducedMotion
    ? undefined
    : FadeInUp.delay(stackIndex * 40)
        .duration(motionTiming.enter)
        .easing(EASE_OUT)
        .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }, { scale: 0.96 }] });

  const exiting = reducedMotion ? undefined : FadeOutDown.duration(motionTiming.exit).easing(EASE_OUT);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={entering}
        exiting={exiting}
        layout={reducedMotion ? undefined : LinearTransition.duration(motionTiming.toggle).easing(EASE_OUT)}
        style={[
          styles.card,
          shadow.float,
          {
            backgroundColor: isDark ? withAlpha("#122016", 0.94) : withAlpha("#FFFCF6", 0.96),
            borderColor: isDark ? withAlpha("#FFFFFF", 0.12) : c.goldLine,
          },
          dragStyle,
        ]}
        pointerEvents="auto"
        accessibilityLiveRegion="polite"
        accessibilityRole={toast.type === "error" ? "alert" : undefined}
      >
        <Pressable
          onPress={dismissThis}
          style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel={`Dismiss: ${label}`}
        >
          <View style={[styles.icon, { backgroundColor: accent.bg }]}>
            <Ionicons name={ICONS[toast.type] || ICONS.info} size={15} color={accent.fg} />
          </View>
          <View style={styles.copy}>
            <Text style={typo.ui(14, "semibold", c.ink, { letterSpacing: -0.15 })} numberOfLines={1}>
              {title}
            </Text>
            {detail ? (
              <Text style={typo.ui(12.5, "medium", c.inkMute, { marginTop: 1, letterSpacing: 0.05 })} numberOfLines={2}>
                {detail}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 9999,
    ...Platform.select({
      web: { position: "fixed", pointerEvents: "none" },
      default: {},
    }),
  },
  stack: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    marginTop: 8,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth + 0.5,
    overflow: "hidden",
    ...Platform.select({
      web: {
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
      },
      default: {},
    }),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  copy: { flex: 1, minWidth: 0 },
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

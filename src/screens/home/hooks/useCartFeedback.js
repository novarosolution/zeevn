import { useCallback, useEffect, useRef, useState } from "react";
import { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { HOME_TOAST } from "../../../content/appContent";
import { buildFlyToCartPath } from "../../../animations/flyToCart";

export default function useCartFeedback({
  addToCart,
  toCartLine,
  safeWindowWidth,
  safeWindowHeight,
  safeBottomInset = 0,
  reducedMotion = false,
}) {
  const [toastQueue, setToastQueue] = useState([]);
  const [flyGhost, setFlyGhost] = useState(null);
  const cartAnchorRef = useRef(null);
  const toastTimersRef = useRef(new Map());
  const toastSeqRef = useRef(0);

  const flyX = useSharedValue(0);
  const flyY = useSharedValue(0);
  const flyScale = useSharedValue(1);
  const flyOpacity = useSharedValue(0);

  const flyGhostStyle = useAnimatedStyle(() => ({
    opacity: flyOpacity.value,
    transform: [{ translateX: flyX.value }, { translateY: flyY.value }, { scale: flyScale.value }],
  }));

  const clearToast = useCallback((id) => {
    const timer = toastTimersRef.current.get(id);
    if (timer) clearTimeout(timer);
    toastTimersRef.current.delete(id);
    setToastQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message = HOME_TOAST.addedToBag, actionLabel = HOME_TOAST.viewBag) => {
      const id = `toast-${Date.now()}-${toastSeqRef.current++}`;
      setToastQueue((prev) => [...prev, { id, message, actionLabel }]);
      const timer = setTimeout(() => clearToast(id), 3000);
      toastTimersRef.current.set(id, timer);
    },
    [clearToast]
  );

  const setCartAnchorRect = useCallback((layoutRect) => {
    cartAnchorRef.current = layoutRect || null;
  }, []);

  const runFlyToCart = useCallback(
    (interactionMeta) => {
      if (reducedMotion) return;
      const sourceRect = interactionMeta?.sourceRect;
      if (!sourceRect) return;
      const target = cartAnchorRef.current;
      const path = buildFlyToCartPath({
        sourceRect,
        targetRect: target,
        safeWindowWidth,
        safeWindowHeight,
        safeBottomInset,
      });
      if (!path) return;
      const { startX, startY, midX, midY, targetX, targetY } = path;

      setFlyGhost({ imageUri: interactionMeta?.imageUri || "" });
      flyX.value = startX;
      flyY.value = startY;
      flyScale.value = 1;
      flyOpacity.value = 0.98;
      flyX.value = withSequence(
        withTiming(midX, { duration: 280, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
        withTiming(targetX, { duration: 200, easing: Easing.bezier(0.2, 0.8, 0.2, 1) })
      );
      flyY.value = withSequence(
        withTiming(midY, { duration: 280, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
        withTiming(targetY, { duration: 200, easing: Easing.bezier(0.2, 0.8, 0.2, 1) })
      );
      flyScale.value = withSequence(
        withTiming(0.92, { duration: 380, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 100, easing: Easing.in(Easing.cubic) })
      );
      flyOpacity.value = withSequence(withTiming(1, { duration: 380 }), withTiming(0, { duration: 100 }));
      setTimeout(() => setFlyGhost(null), 520);
    },
    [flyOpacity, flyScale, flyX, flyY, reducedMotion, safeBottomInset, safeWindowHeight, safeWindowWidth]
  );

  const addWithFeedback = useCallback(
    (product, interactionMeta) => {
      const line = typeof toCartLine === "function" ? toCartLine(product) : product;
      addToCart(line);
      showToast();
      runFlyToCart(interactionMeta);
    },
    [addToCart, runFlyToCart, showToast, toCartLine]
  );

  useEffect(
    () => () => {
      toastTimersRef.current.forEach((timer) => clearTimeout(timer));
      toastTimersRef.current.clear();
    },
    []
  );

  return {
    toastQueue,
    flyGhost,
    flyGhostStyle,
    addWithFeedback,
    clearToast,
    setCartAnchorRect,
  };
}

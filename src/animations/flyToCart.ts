type RectLike = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

type FlyToCartArgs = {
  sourceRect?: RectLike | null;
  targetRect?: RectLike | null;
  safeWindowWidth?: number;
  safeWindowHeight?: number;
  safeBottomInset?: number;
};

export function buildFlyToCartPath({
  sourceRect,
  targetRect,
  safeWindowWidth = 360,
  safeWindowHeight = 800,
  safeBottomInset = 0,
}: FlyToCartArgs) {
  if (!sourceRect) return null;

  const targetX =
    Number(targetRect?.x) + Number(targetRect?.width || 20) * 0.5 - 20 || Number(safeWindowWidth) * 0.8;
  const targetY =
    Number(targetRect?.y) + Number(targetRect?.height || 20) * 0.5 - 20 ||
    Number(safeWindowHeight) - Number(safeBottomInset) - 84;
  const startX = Number(sourceRect?.x || 0) + Number(sourceRect?.width || 48) * 0.5 - 20;
  const startY = Number(sourceRect?.y || 0) + Number(sourceRect?.height || 48) * 0.5 - 20;
  const midX = (startX + targetX) / 2 + 18;
  const midY = Math.min(startY, targetY) - 76;

  return { startX, startY, midX, midY, targetX, targetY };
}


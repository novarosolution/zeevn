import React, { memo } from "react";
import { radius } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import Skeleton from "./Skeleton";

const ROUNDED = {
  none: 0,
  sm: radius.sm,
  md: radius.md,
  lg: radius.lg,
  xl: radius.xl,
  pill: radius.pill,
};

/** @deprecated Prefer {@link Skeleton} — maps legacy `rounded` tokens to radii. */
function SkeletonBlockBase({ width = "100%", height = 16, rounded = "md", style, shimmer = true }) {
  const { RADII } = useTheme();
  const mapped =
    typeof rounded === "number" ? rounded : ROUNDED[rounded] ?? RADII.md;
  return <Skeleton width={width} height={height} radius={mapped} style={style} shimmer={shimmer} />;
}

const SkeletonBlock = memo(SkeletonBlockBase);

export default SkeletonBlock;

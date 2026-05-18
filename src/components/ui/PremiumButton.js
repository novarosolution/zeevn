import React, { memo, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { icon } from "../../theme/tokens";
import { useTheme } from "../../context/ThemeContext";
import Button from "./Button";

const ICON_BY_SIZE = {
  sm: icon.xs,
  md: icon.sm,
  lg: icon.md,
};

/**
 * @deprecated Use `Button` from `components/ui` (or `@/components/ui`) instead.
 * This shim exists for backward compatibility during migration.
 */
function PremiumButtonBase({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  pulse: _pulse,
  ...rest
}) {
  const { semanticPalette } = useTheme();

  const mappedVariant = useMemo(() => {
    if (variant === "danger") return "destructive";
    if (variant === "subtle") return "ghost";
    if (variant === "primary" || variant === "secondary" || variant === "ghost") return variant;
    return "primary";
  }, [variant]);

  const mappedSize = size === "xl" ? "lg" : size === "sm" || size === "md" || size === "lg" ? size : "md";

  const ink = semanticPalette.ink;
  const inverse = semanticPalette.inkInverse;

  const glyphColor = useMemo(() => {
    if (mappedVariant === "primary" || mappedVariant === "destructive") return inverse;
    return ink;
  }, [inverse, ink, mappedVariant]);

  const isize = ICON_BY_SIZE[mappedSize] || icon.sm;

  const left =
    typeof iconLeft === "string" ? (
      <Ionicons name={iconLeft} size={isize} color={glyphColor} />
    ) : (
      iconLeft
    );
  const right =
    typeof iconRight === "string" ? (
      <Ionicons name={iconRight} size={isize} color={glyphColor} />
    ) : (
      iconRight
    );

  return (
    <Button variant={mappedVariant} size={mappedSize} iconLeft={left} iconRight={right} {...rest} />
  );
}

const PremiumButton = memo(PremiumButtonBase);

export default PremiumButton;

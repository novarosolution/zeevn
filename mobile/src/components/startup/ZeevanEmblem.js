/**
 * The Zeevan launch emblem (gold ring + sprouting leaf) drawn from `theme/zeevanMark.json` — the same geometry the
 * native splash images are rendered from, so the system splash hands over to this without a visible seam.
 *
 * Everything here is static vector art; the boot screen animates the *views* around it (transform / opacity only —
 * redrawing SVG every frame is what burns CPU).
 */
import React, { memo } from "react";
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
import mark from "../../theme/zeevanMark.json";

const SPAN = mark.box + mark.margin * 2;
const VIEW_BOX = `${-mark.margin} ${-mark.margin} ${SPAN} ${SPAN}`;

/** Canvas pixels per mark unit for an emblem canvas `size` wide. */
export const markUnit = (size) => size / SPAN;

/** Distance from the canvas centre to the outer edge of the ring (mark units). */
export const RING_OUTER = mark.ring.r + 1.05;

const paint = (value) => (value === "gold" ? "url(#zv-gold)" : value === "leaf" ? "url(#zv-leaf)" : value);

/** The emblem itself, with the soft halo inside the ring. */
export const Emblem = memo(function Emblem({ size, dark = false }) {
  const p = mark.palette[dark ? "dark" : "light"];
  const { gold, leaf } = mark.gradients;
  const { halo } = mark;
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Defs>
        <LinearGradient id="zv-gold" gradientUnits="userSpaceOnUse" x1={gold.from[0]} y1={gold.from[1]} x2={gold.to[0]} y2={gold.to[1]}>
          <Stop offset="0" stopColor={p.top} />
          <Stop offset="0.5" stopColor={p.mid} />
          <Stop offset="1" stopColor={p.bot} />
        </LinearGradient>
        <LinearGradient id="zv-leaf" gradientUnits="userSpaceOnUse" x1={leaf.from[0]} y1={leaf.from[1]} x2={leaf.to[0]} y2={leaf.to[1]}>
          <Stop offset="0" stopColor={p.top} />
          <Stop offset="0.5" stopColor={p.mid} />
          <Stop offset="1" stopColor={p.bot} />
        </LinearGradient>
        <RadialGradient id="zv-halo" gradientUnits="userSpaceOnUse" cx={halo.cx} cy={halo.cy} r={halo.r}>
          <Stop offset="0" stopColor={p.mid} stopOpacity={halo.opacity[dark ? "dark" : "light"]} />
          <Stop offset="1" stopColor={p.mid} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={halo.cx} cy={halo.cy} r={halo.r} fill="url(#zv-halo)" />
      {mark.layers.map((layer, i) => {
        const common = {
          key: i,
          fill: layer.fill ? paint(layer.fill) : "none",
          stroke: layer.stroke ? paint(layer.stroke) : undefined,
          strokeWidth: layer.width,
          strokeLinecap: layer.cap,
          opacity: layer.opacity,
        };
        return layer.kind === "circle" ? (
          <Circle {...common} cx={layer.cx} cy={layer.cy} r={layer.r} />
        ) : (
          <Path {...common} d={layer.d} />
        );
      })}
    </Svg>
  );
});

/**
 * A short bright arc with a fading tail, drawn on the ring with its head at 12 o'clock. Rotate the wrapping view
 * about its centre to send the glint around the emblem.
 */
export const EmblemComet = memo(function EmblemComet({ size, dark = false, sweep = 78 }) {
  const p = mark.palette[dark ? "dark" : "light"];
  const { cx, cy, r } = mark.ring;
  const at = (deg) => [cx + r * Math.sin((deg * Math.PI) / 180), cy - r * Math.cos((deg * Math.PI) / 180)];
  const [x1, y1] = at(-sweep);
  const [x2, y2] = at(0);
  return (
    <Svg width={size} height={size} viewBox={VIEW_BOX}>
      <Defs>
        <LinearGradient id="zv-tail" gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
          <Stop offset="0" stopColor={p.glint} stopOpacity="0" />
          <Stop offset="0.65" stopColor={p.glint} stopOpacity="0.6" />
          <Stop offset="1" stopColor={p.glint} stopOpacity="1" />
        </LinearGradient>
        <RadialGradient id="zv-head" gradientUnits="userSpaceOnUse" cx={x2} cy={y2} r="10">
          <Stop offset="0" stopColor={p.glint} stopOpacity="0.9" />
          <Stop offset="1" stopColor={p.glint} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Path d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} fill="none" stroke="url(#zv-tail)" strokeWidth={3.4} strokeLinecap="round" />
      <Circle cx={x2} cy={y2} r="10" fill="url(#zv-head)" />
    </Svg>
  );
});

/** A wide, soft pool of warm light — scale and fade the wrapping view to make the emblem "bloom". */
export const EmblemBloom = memo(function EmblemBloom({ size, dark = false }) {
  const p = mark.palette[dark ? "dark" : "light"];
  const peak = dark ? 0.3 : 0.22;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="zv-bloom" gradientUnits="userSpaceOnUse" cx="50" cy="50" r="50">
          <Stop offset="0" stopColor={p.mid} stopOpacity={peak} />
          <Stop offset="0.45" stopColor={p.mid} stopOpacity={peak * 0.38} />
          <Stop offset="1" stopColor={p.mid} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#zv-bloom)" />
    </Svg>
  );
});

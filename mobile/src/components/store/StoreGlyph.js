import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

/** Pointy-top hexagon path (honeycomb cell). */
function hex(cx, cy, r) {
  const dx = 0.866 * r;
  const pts = [
    [cx, cy - r],
    [cx + dx, cy - r / 2],
    [cx + dx, cy + r / 2],
    [cx, cy + r],
    [cx - dx, cy + r / 2],
    [cx - dx, cy - r / 2],
  ];
  return `M${pts.map((p) => p.map((n) => Number(n.toFixed(2))).join(" ")).join("L")}Z`;
}

/**
 * Zeevan range glyphs — 24×24 line icons drawn for the category tabs.
 * `body: true` shapes pick up a soft tint when the glyph is active.
 */
export const GLYPHS = {
  all: [
    { t: "rect", x: 3.8, y: 3.8, w: 7, h: 7, rx: 2, body: true },
    { t: "rect", x: 13.2, y: 3.8, w: 7, h: 7, rx: 2, body: true },
    { t: "rect", x: 3.8, y: 13.2, w: 7, h: 7, rx: 2, body: true },
    { t: "rect", x: 13.2, y: 13.2, w: 7, h: 7, rx: 2, body: true },
  ],
  ghee: [
    { t: "rect", x: 7, y: 2.8, w: 10, h: 3.2, rx: 1.3 },
    { t: "rect", x: 4.8, y: 6.2, w: 14.4, h: 15, rx: 4, body: true },
    { t: "rect", x: 8.2, y: 11.2, w: 7.6, h: 5.2, rx: 1.4, sw: 1.4 },
  ],
  tel: [
    { t: "rect", x: 9.8, y: 2.4, w: 4.4, h: 2.4, rx: 0.9 },
    { t: "path", d: "M10.4 4.8V7c0 1.2-3 1.8-3 4.6v7.2c0 1.2 1 2.2 2.2 2.2h4.8c1.2 0 2.2-1 2.2-2.2v-7.2c0-2.8-3-3.4-3-4.6V4.8", body: true },
    { t: "path", d: "M12 11.2c1.5 1.8 2.2 3 2.2 4a2.2 2.2 0 0 1-4.4 0c0-1 .7-2.2 2.2-4z", sw: 1.5 },
  ],
  masala: [
    { t: "path", d: "M16.6 4.6C19.8 5 21.2 8.4 20.1 11.6 18.6 16 13.8 19.8 6.4 20.4 5.2 20.5 4.8 19.4 5.7 18.7 9.6 15.5 10.8 12.6 10.6 9.6 10.4 7.2 12.6 4.4 16.6 4.6Z", body: true },
    { t: "path", d: "M16.6 4.6C16.9 3.4 17.9 2.6 19.3 2.5" },
  ],
  honey: [
    { t: "path", d: hex(8.5, 7.6, 4), body: true },
    { t: "path", d: hex(15.5, 7.6, 4), body: true },
    { t: "path", d: hex(12, 13.7, 4), body: true },
    { t: "path", d: "M12 18.5c1 1.2 1.5 2 1.5 2.7a1.5 1.5 0 0 1-3 0c0-.7.5-1.5 1.5-2.7z", sw: 1.4 },
  ],
  gifts: [
    { t: "rect", x: 3.4, y: 8.2, w: 17.2, h: 4, rx: 1.3, body: true },
    { t: "rect", x: 4.9, y: 12.2, w: 14.2, h: 8.6, rx: 1.6, body: true },
    { t: "path", d: "M12 8.2V20.8" },
    { t: "path", d: "M12 8.2C12 8.2 8.4 8.4 7.8 6 7.4 4.2 10.4 3.4 12 8.2Z" },
    { t: "path", d: "M12 8.2C12 8.2 15.6 8.4 16.2 6 16.6 4.2 13.6 3.4 12 8.2Z" },
  ],
};

export default function StoreGlyph({ name, size = 24, color = "#244424", active = false }) {
  const shapes = GLYPHS[name];
  if (!shapes) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {shapes.map((shape, i) => {
        const common = {
          stroke: color,
          strokeWidth: shape.sw || 1.7,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          fill: active && shape.body ? color : "none",
          fillOpacity: active && shape.body ? 0.2 : 0,
        };
        return shape.t === "rect" ? (
          <Rect key={i} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} {...common} />
        ) : (
          <Path key={i} d={shape.d} {...common} />
        );
      })}
    </Svg>
  );
}

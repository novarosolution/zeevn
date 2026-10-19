/**
 * Hand-drawn SVG ornaments — lotus mandala, four-point sparkle and olive sprig. The animated festive
 * artwork (diyas, fairy lights, rangoli) is composed from these in `HomeArt.js`.
 */
import React, { memo } from "react";
import { Circle, G, Path } from "react-native-svg";

function quad(p0, p1, p2, t) {
  const u = 1 - t;
  return { x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y };
}

function quadTangentDeg(p0, p1, p2, t) {
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

/** Concentric lotus petals, centred at (cx, cy). */
export const LotusMandala = memo(function LotusMandala({ cx, cy, radius = 74, color = "#C98F3A", opacity = 0.22 }) {
  const layers = [
    { n: 12, r: radius, off: 0, w: 0.26 },
    { n: 12, r: radius * 0.72, off: 15, w: 0.26 },
    { n: 8, r: radius * 0.42, off: 0, w: 0.3 },
  ];
  const nodes = [];
  layers.forEach((layer, li) => {
    for (let i = 0; i < layer.n; i += 1) {
      const a = (360 / layer.n) * i + layer.off;
      const r = layer.r;
      const w = r * layer.w;
      nodes.push(
        <Path
          key={`${li}-${i}`}
          d={`M0 0 C ${w} ${-r * 0.3} ${w} ${-r * 0.72} 0 ${-r} C ${-w} ${-r * 0.72} ${-w} ${-r * 0.3} 0 0 Z`}
          fill={color}
          fillOpacity={opacity * 0.45}
          stroke={color}
          strokeOpacity={opacity * 1.9}
          strokeWidth={0.9}
          transform={`translate(${cx} ${cy}) rotate(${a})`}
        />
      );
    }
  });
  nodes.push(<Circle key="core" cx={cx} cy={cy} r={radius * 0.1} fill={color} fillOpacity={opacity * 2} />);
  return <G>{nodes}</G>;
});

/** Four-point sparkle. */
export const Sparkle = memo(function Sparkle({ cx, cy, r = 6, color = "#E4A93C", opacity = 0.85 }) {
  const k = r * 0.22;
  return (
    <Path
      d={`M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r} Z`}
      fill={color}
      opacity={opacity}
    />
  );
});

/** A curved olive sprig with paired leaves (everyday banner). */
export const Sprig = memo(function Sprig({ from, ctrl, to, leaves = 6, color = "#788844", flip = false }) {
  const nodes = [];
  nodes.push(<Path key="stem" d={`M${from.x} ${from.y} Q${ctrl.x} ${ctrl.y} ${to.x} ${to.y}`} stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeOpacity={0.8} />);
  for (let i = 1; i <= leaves; i += 1) {
    const t = i / (leaves + 1);
    const p = quad(from, ctrl, to, t);
    const deg = quadTangentDeg(from, ctrl, to, t);
    const size = 11 - i * 0.7;
    [-1, 1].forEach((side) => {
      const rot = deg + side * (flip ? -42 : 42);
      nodes.push(
        <Path
          key={`${i}-${side}`}
          d={`M0 0 C ${size * 0.5} ${-size * 0.55} ${size * 1.2} ${-size * 0.5} ${size * 1.7} 0 C ${size * 1.2} ${size * 0.5} ${size * 0.5} ${size * 0.55} 0 0 Z`}
          fill={color}
          opacity={0.78}
          transform={`translate(${p.x} ${p.y}) rotate(${rot})`}
        />
      );
    });
  }
  return <G>{nodes}</G>;
});

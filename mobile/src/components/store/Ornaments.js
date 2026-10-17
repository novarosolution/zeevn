/**
 * Hand-drawn SVG ornaments for the festive banner — marigold garlands, fairy-light strings,
 * lotus mandala, diyas, sparkles and olive sprigs. Everything is drawn in a 402×140 design space
 * and scaled by the parent `<Svg viewBox>`.
 */
import React, { memo } from "react";
import { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from "react-native-svg";

const MARIGOLD = [
  { outer: "#F59E0B", petal: "#FBBF24", inner: "#EA7A12", center: "#B4470B" },
  { outer: "#F8B21B", petal: "#FCD34D", inner: "#F0901A", center: "#C2570C" },
];

function quad(p0, p1, p2, t) {
  const u = 1 - t;
  return { x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y };
}

function quadTangentDeg(p0, p1, p2, t) {
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function Marigold({ cx, cy, r, palette }) {
  const ring = [];
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ring.push(<Circle key={i} cx={cx + Math.cos(a) * r * 0.74} cy={cy + Math.sin(a) * r * 0.74} r={r * 0.4} fill={palette.petal} />);
  }
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill={palette.outer} />
      {ring}
      <Circle cx={cx} cy={cy} r={r * 0.54} fill={palette.inner} />
      <Circle cx={cx} cy={cy} r={r * 0.2} fill={palette.center} />
    </G>
  );
}

function Bulb({ cx, cy, r, color }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r * 2.6} fill={color} opacity={0.18} />
      <Circle cx={cx} cy={cy} r={r * 1.6} fill={color} opacity={0.3} />
      <Circle cx={cx} cy={cy} r={r} fill="#FFF3C4" />
    </G>
  );
}

/**
 * A draped garland along a quadratic curve.
 * `kind`: "marigold" (flowers + leaves + hanging strands) | "lights" (rope with glowing bulbs).
 */
export const Garland = memo(function Garland({ from, ctrl, to, count = 12, kind = "marigold", strands = [], rope = "#8A5A1B" }) {
  const nodes = [];
  const path = `M${from.x} ${from.y} Q${ctrl.x} ${ctrl.y} ${to.x} ${to.y}`;
  nodes.push(<Path key="rope" d={path} stroke={rope} strokeWidth={1.4} strokeOpacity={0.55} fill="none" strokeLinecap="round" />);

  if (kind === "lights") {
    const colors = ["#FFD166", "#FF9F43", "#FFE08A", "#FFB454"];
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const p = quad(from, ctrl, to, t);
      nodes.push(<Bulb key={`b${i}`} cx={p.x} cy={p.y + 3.5} r={2.6} color={colors[i % colors.length]} />);
    }
    return <G>{nodes}</G>;
  }

  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    const p = quad(from, ctrl, to, t);
    if (i < count - 1) {
      const tm = (i + 0.5) / (count - 1);
      const m = quad(from, ctrl, to, tm);
      const deg = quadTangentDeg(from, ctrl, to, tm);
      nodes.push(
        <Ellipse
          key={`l${i}`}
          cx={m.x}
          cy={m.y + 2}
          rx={6.4}
          ry={2.7}
          fill="#5C6834"
          opacity={0.92}
          transform={`rotate(${deg + (i % 2 ? 28 : -28)} ${m.x} ${m.y + 2})`}
        />
      );
    }
    nodes.push(<Marigold key={`f${i}`} cx={p.x} cy={p.y} r={7.2} palette={MARIGOLD[i % 2]} />);
  }

  strands.forEach((s, si) => {
    const base = quad(from, ctrl, to, s.t);
    const beads = Math.max(2, Math.round(s.length / 8.5));
    nodes.push(
      <Path key={`sr${si}`} d={`M${base.x} ${base.y} L${base.x} ${base.y + s.length}`} stroke={rope} strokeWidth={1} strokeOpacity={0.5} />
    );
    for (let b = 1; b <= beads; b += 1) {
      nodes.push(<Marigold key={`sb${si}-${b}`} cx={base.x} cy={base.y + b * 8.5} r={4.4} palette={MARIGOLD[(b + si) % 2]} />);
    }
    const by = base.y + beads * 8.5 + 7;
    nodes.push(
      <G key={`bell${si}`}>
        <Path d={`M${base.x - 4} ${by} Q${base.x} ${by - 6} ${base.x + 4} ${by} L${base.x + 5.2} ${by + 5} L${base.x - 5.2} ${by + 5} Z`} fill="#D9A441" />
        <Circle cx={base.x} cy={by + 6.2} r={1.5} fill="#8A5A1B" />
      </G>
    );
  });

  return <G>{nodes}</G>;
});

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

/** A brass diya with a glowing flame. */
export const Diya = memo(function Diya({ cx, cy, scale = 1, id = "diya" }) {
  return (
    <G transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <Defs>
        <RadialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFD66B" stopOpacity={0.75} />
          <Stop offset="100%" stopColor="#FFD66B" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={0} cy={-12} r={20} fill={`url(#${id}-glow)`} />
      <Path d="M0 -24 C 5 -17 5.5 -10 0 -5 C -5.5 -10 -5 -17 0 -24 Z" fill="#FFB02E" />
      <Path d="M0 -19 C 2.4 -15 2.6 -11 0 -8 C -2.6 -11 -2.4 -15 0 -19 Z" fill="#FFF1B8" />
      <Path d="M-16 -3 L16 -3 C 16 7 8 12 0 12 C -8 12 -16 7 -16 -3 Z" fill="#C98A2B" />
      <Path d="M-16 -3 L16 -3 L14.5 0 L-14.5 0 Z" fill="#E8B04D" />
      <Path d="M-9 8 C -4 11 4 11 9 8" stroke="#8A5A1B" strokeOpacity={0.45} strokeWidth={1} fill="none" strokeLinecap="round" />
    </G>
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

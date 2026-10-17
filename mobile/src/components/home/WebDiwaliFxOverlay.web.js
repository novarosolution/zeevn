import React, { useMemo } from "react";
import { Platform } from "react-native";
import { HOME_SCREEN_UI } from "../../content/appContent";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";

const CSS_ID = "zeevan-diwali-fx-hero-v2";

injectWebCssOnce(
  CSS_ID,
  `@keyframes zeevanHeroDust {
  0% { transform: translate3d(0, 8px, 0); opacity: 0; }
  15% { opacity: 0.95; }
  100% { transform: translate3d(var(--dx, 16px), -420px, 0); opacity: 0; }
}
@keyframes zeevanHeroOrb {
  0%, 100% { transform: scale(1); opacity: 0.45; }
  50% { transform: scale(1.15); opacity: 0.8; }
}
@keyframes zeevanHeroFlame {
  0%, 100% { transform: translateY(0) scaleY(1); opacity: 0.7; }
  50% { transform: translateY(-5px) scaleY(1.1); opacity: 1; }
}
@keyframes zeevanHeroSpark {
  0% { transform: scale(0.2); opacity: 0; }
  20% { opacity: 0.75; }
  100% { transform: scale(1.5); opacity: 0; }
}
.zeevan-hero-fx {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.zeevan-hero-fx-orb {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 214, 120, 0.65) 0%, rgba(212, 160, 60, 0.2) 48%, transparent 72%);
  animation: zeevanHeroOrb 6s ease-in-out infinite;
}
.zeevan-hero-fx-flame {
  position: absolute;
  width: 10px;
  height: 22px;
  border-radius: 50% 50% 40% 40%;
  background: radial-gradient(ellipse at 50% 85%, #FFF8E0 0%, #F0C14A 40%, rgba(200, 90, 20, 0.3) 75%, transparent 100%);
  box-shadow: 0 0 16px 4px rgba(240, 193, 74, 0.4);
  animation: zeevanHeroFlame 2.2s ease-in-out infinite;
}
.zeevan-hero-fx-dust {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, #FFE9A8 0%, #E8B84A 55%, transparent 100%);
  box-shadow: 0 0 5px 1px rgba(255, 210, 100, 0.5);
  animation: zeevanHeroDust var(--dur, 7s) linear infinite;
  animation-delay: var(--delay, 0s);
}
.zeevan-hero-fx-spark {
  position: absolute;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background:
    repeating-conic-gradient(from 0deg, rgba(255, 220, 140, 0.5) 0deg 6deg, transparent 6deg 18deg),
    radial-gradient(circle, rgba(255, 210, 100, 0.28) 0%, transparent 55%);
  animation: zeevanHeroSpark var(--sdur, 5s) ease-out infinite;
  animation-delay: var(--sdelay, 0s);
}
@media (prefers-reduced-motion: reduce) {
  .zeevan-hero-fx-orb,
  .zeevan-hero-fx-flame,
  .zeevan-hero-fx-dust,
  .zeevan-hero-fx-spark { animation: none !important; opacity: 0.3; }
}`
);

function makeDust(n) {
  const out = [];
  for (let i = 0; i < n; i += 1) {
    out.push({
      key: `d${i}`,
      left: `${6 + ((i * 21) % 88)}%`,
      bottom: `${2 + (i % 6) * 3}%`,
      delay: `${(i * 0.45) % 6}s`,
      dur: `${5.5 + (i % 4) * 1.1}s`,
      dx: `${(i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 6)}px`,
      size: 3 + (i % 3),
    });
  }
  return out;
}

/** Clipped inside Diwali hero only — no page-wide overlay. */
export default function WebDiwaliFxOverlay({ compact = false }) {
  const enabled =
    HOME_SCREEN_UI.web?.showDiwaliFx !== false && HOME_SCREEN_UI.web?.showDiwaliFestive !== false;
  const dust = useMemo(() => makeDust(compact ? 8 : 14), [compact]);

  if (!enabled || Platform.OS !== "web") return null;

  return (
    <div className="zeevan-hero-fx" aria-hidden="true">
      <div
        className="zeevan-hero-fx-orb"
        style={{ top: "8%", left: "6%", width: compact ? 90 : 120, height: compact ? 90 : 120 }}
      />
      <div
        className="zeevan-hero-fx-orb"
        style={{
          top: "14%",
          right: "4%",
          width: compact ? 70 : 100,
          height: compact ? 70 : 100,
          animationDelay: "1.5s",
        }}
      />
      {!compact ? (
        <div
          className="zeevan-hero-fx-orb"
          style={{ bottom: "12%", left: "8%", width: 90, height: 90, animationDelay: "2.4s" }}
        />
      ) : null}

      <div className="zeevan-hero-fx-flame" style={{ top: "24%", left: "3%", animationDelay: "0.3s" }} />
      <div className="zeevan-hero-fx-flame" style={{ top: "58%", right: "4%", animationDelay: "1.1s" }} />

      <div
        className="zeevan-hero-fx-spark"
        style={{
          top: "10%",
          right: compact ? "12%" : "18%",
          width: compact ? 64 : 88,
          height: compact ? 64 : 88,
          ["--sdelay"]: "0s",
          ["--sdur"]: "5.2s",
        }}
      />

      {dust.map((p) => (
        <div
          key={p.key}
          className="zeevan-hero-fx-dust"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            ["--delay"]: p.delay,
            ["--dur"]: p.dur,
            ["--dx"]: p.dx,
          }}
        />
      ))}
    </div>
  );
}

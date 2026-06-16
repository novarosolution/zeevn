import { Platform } from "react-native";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";

const ROOT = "kankreg-process-wrap";

/** Scoped process journey cinema styles (cream editorial film timeline). */
export function injectProcessCinemaStyles() {
  if (Platform.OS !== "web") return;

  injectWebCssOnce(
    "kankreg-process-space-mono",
    `@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');`
  );

  injectWebCssOnce(
    "kankreg-process-cinema-v1",
    `
.${ROOT}{
  --ink:#0A0907;--ghee:#E2A93E;--gilt:#F4D596;--gilt-soft:#b89253;
  --cream:#F7F1E4;--cream-dim:#c8bda4;--paper:#F5EFE4;--line:rgba(169,119,46,.22);
  --maxw:1200px;--ease:cubic-bezier(.22,1,.36,1);
  position:relative;z-index:1;width:100%;
  color:var(--ink);font-family:Inter,Hanken Grotesk,system-ui,sans-serif;line-height:1.55;
  background:
    radial-gradient(120% 80% at 12% -8%,rgba(214,173,91,.14),transparent 55%),
    radial-gradient(90% 60% at 92% 108%,rgba(60,98,72,.08),transparent 50%),
    var(--paper);
  -webkit-font-smoothing:antialiased;overflow-x:clip;
}
.${ROOT} .kankreg-process-inner{position:relative;z-index:2;max-width:var(--maxw);margin:0 auto;padding:0 clamp(16px,4vw,32px)}
.${ROOT} .kankreg-process-prologue{padding:clamp(40px,8vh,72px) 0 clamp(28px,5vh,48px);text-align:center}
.${ROOT} .kankreg-process-chapter{
  display:inline-flex;align-items:center;gap:11px;font-family:"Space Mono",ui-monospace,monospace;
  font-size:11px;letter-spacing:.36em;text-transform:uppercase;color:var(--ghee);
}
.${ROOT} .kankreg-process-chapter::before,.${ROOT} .kankreg-process-chapter::after{
  content:"";width:34px;height:1px;background:linear-gradient(90deg,transparent,var(--gilt-soft));
}
.${ROOT} .kankreg-process-chapter::after{transform:scaleX(-1)}
.${ROOT} .kankreg-process-title{
  font-family:Fraunces_700Bold,Georgia,serif;font-weight:400;font-size:clamp(2rem,5.8vw,4.2rem);
  line-height:1.08;letter-spacing:-.025em;margin:20px 0 0;padding:0;border:0;color:var(--ink);text-align:center;
}
.${ROOT} .kankreg-process-subtitle{
  margin:14px auto 0;max-width:560px;font-size:clamp(.98rem,1.8vw,1.12rem);color:rgba(10,9,7,.62);text-align:center;
}
.${ROOT} .kankreg-process-opening{
  margin:18px auto 0;max-width:520px;font-family:Fraunces_700Bold,Georgia,serif;font-style:normal;font-weight:400;
  font-size:clamp(1rem,1.9vw,1.2rem);color:rgba(10,9,7,.5);text-align:center;
}
.${ROOT} .kankreg-process-hairline{
  height:1px;width:min(220px,60%);margin:28px auto 0;
  background:linear-gradient(90deg,transparent,var(--ghee),transparent);
}
.${ROOT} .kankreg-process-journey-chip{
  display:inline-flex;align-items:center;gap:8px;margin:22px auto 0;padding:8px 16px;
  border-radius:999px;border:1px solid var(--line);background:rgba(255,253,248,.72);
  font-family:"Space Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--ghee);
}
.${ROOT} .kankreg-process-body{display:grid;grid-template-columns:minmax(72px,88px) 1fr;gap:clamp(20px,3vw,40px);padding-bottom:clamp(48px,8vh,80px)}
.${ROOT} .kankreg-process-spine{position:sticky;top:clamp(72px,12vh,108px);align-self:start;height:fit-content;padding-top:8px}
.${ROOT} .kankreg-process-spine-track{position:relative;width:2px;margin:0 auto;background:rgba(169,119,46,.18);border-radius:2px;min-height:240px}
.${ROOT} .kankreg-process-spine-fill{
  position:absolute;left:0;top:0;width:100%;height:0%;border-radius:2px;
  background:linear-gradient(180deg,var(--ghee),var(--gilt));transition:height .35s var(--ease);
}
.${ROOT} .kankreg-process-spine-nodes{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:0}
.${ROOT} .kankreg-process-node{
  position:relative;display:grid;place-items:center;width:36px;height:36px;margin-left:-17px;
  border-radius:50%;border:1px solid var(--line);background:var(--paper);
  font-family:Fraunces_700Bold,serif;font-size:13px;color:rgba(10,9,7,.45);transition:all .35s var(--ease);cursor:default;
}
.${ROOT} .kankreg-process-node-on{
  border-color:var(--ghee);color:var(--ink);background:rgba(226,169,62,.12);
  box-shadow:0 0 0 4px rgba(226,169,62,.12),0 0 20px rgba(226,169,62,.18);
}
.${ROOT} .kankreg-process-panels{display:flex;flex-direction:column;gap:clamp(28px,5vh,52px)}
.${ROOT} .kankreg-process-panel{
  display:grid;grid-template-columns:1fr;gap:18px;opacity:1;transform:none;
  content-visibility:auto;contain-intrinsic-size:auto 520px;
}
.${ROOT} .kankreg-process-panel-on .kankreg-process-frame{
  border-color:rgba(201,146,30,.45);
  box-shadow:0 2px 4px rgba(60,45,20,.04),0 28px 64px -24px rgba(80,60,25,.28);
}
.${ROOT} .kankreg-process-panel-meta{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  font-family:"Space Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(10,9,7,.45);
}
.${ROOT} .kankreg-process-panel-num{color:var(--ghee);font-family:Fraunces_700Bold,serif;font-size:1.4rem;letter-spacing:0;text-transform:none}
.${ROOT} .kankreg-process-frame{
  position:relative;border-radius:18px;overflow:hidden;border:1px solid var(--line);
  background:#1a1714;aspect-ratio:16/10;
  box-shadow:0 2px 4px rgba(60,45,20,.04),0 24px 56px -28px rgba(80,60,25,.22);
}
.${ROOT} .kankreg-process-frame img{width:100%;height:100%;object-fit:cover;display:block}
.${ROOT} .kankreg-process-frame-fallback{
  width:100%;height:100%;background:linear-gradient(140deg,#3c2708 0%,#100a03 100%);
}
.${ROOT} .kankreg-process-scrim{
  position:absolute;inset:0;background:linear-gradient(0deg,rgba(8,6,4,.55) 0%,transparent 42%,rgba(8,6,4,.12) 100%);
  pointer-events:none;
}
.${ROOT} .kankreg-process-frame-rule{
  position:absolute;left:20px;right:20px;bottom:0;height:1px;background:rgba(244,213,150,.45);
}
.${ROOT} .kankreg-process-copy{padding:4px 2px 0}
.${ROOT} .kankreg-process-copy h3{
  margin:0 0 10px;font-family:Fraunces_700Bold,Georgia,serif;font-weight:400;
  font-size:clamp(1.35rem,2.4vw,1.85rem);line-height:1.15;letter-spacing:-.015em;color:var(--ink);
}
.${ROOT} .kankreg-process-copy p{margin:0;font-size:clamp(.92rem,1.5vw,1.02rem);line-height:1.6;color:rgba(10,9,7,.62)}

.${ROOT}.kankreg-process-static-mode .kankreg-process-panel{opacity:1;transform:none}
.${ROOT}.kankreg-process-static-mode .kankreg-process-spine-fill{height:100%!important}

@media (max-width:900px){
  .${ROOT} .kankreg-process-body{grid-template-columns:1fr}
  .${ROOT} .kankreg-process-spine{
    position:relative;top:auto;display:flex;align-items:center;gap:12px;padding:0 0 8px;
  }
  .${ROOT} .kankreg-process-spine-track{display:none}
  .${ROOT} .kankreg-process-spine-nodes{
    position:relative;inset:auto;flex-direction:row;justify-content:flex-start;gap:8px;padding:0;
  }
  .${ROOT} .kankreg-process-node{width:32px;height:32px;margin:0;font-size:11px}
  .${ROOT} .kankreg-process-frame{aspect-ratio:4/5}
}
.${ROOT} :focus-visible{outline:2px solid var(--ghee);outline-offset:3px}
`
  );
}

export const PROCESS_CINEMA_ROOT_CLASS = ROOT;

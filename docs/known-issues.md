# Known Issues

## RN-Web mobile Lighthouse

React Native Web ships a large initial JS bundle. Mobile Lighthouse performance scores are typically **10–15 points lower** than desktop on the same build. Targets: mobile perf ≥ 75, desktop ≥ 85. Mitigations: route-level code splitting, hero WebP + preload, deferred GSAP/Leaflet/admin bundles. See [`docs/perf/final-summary.json`](./perf/final-summary.json).

## Android Chrome (Web App)

### Symptoms

- URL bar expand/collapse can cause viewport height jumps.
- Fixed header layers can flicker or jump during scroll.
- `backdrop-filter` may be unavailable on older Android Chrome builds.
- Touch interactions can feel duplicated on custom controls.
- Smooth-scroll engines can conflict with Android pull-to-refresh behavior.
- Low-end devices can stutter on non-essential layout animations.

### Mitigations in Zeevan

- Dynamic viewport CSS var (`--app-vh`) is updated on `resize`, `orientationchange`, and `visualViewport.resize`.
- Full-height web surfaces now use `calc(var(--app-vh, 1vh) * 100)` instead of raw `100vh`.
- Fixed layer stabilization adds `translateZ(0)` + `will-change: transform`.
- Mobile web input zoom is reduced by enforcing `font-size: 16px` on coarse-pointer inputs.
- Global interactive touch optimization uses `touch-action: manipulation` for links and buttons.
- Header blur now has runtime fallback to opaque backgrounds when backdrop blur is unsupported.
- Lenis is disabled on Android user agents to avoid scroll race conditions.
- Non-essential card/reorder layout motion is reduced on low-end web hardware.

### Device Repro Capture

1. Open `.../dev-debug?key=zeevan-debug` on the affected Android device.
2. Capture one screenshot of the debug page.
3. Capture one screenshot/video of the broken app page.
4. Share both captures so UA, viewport, and feature support can be matched to the glitch.


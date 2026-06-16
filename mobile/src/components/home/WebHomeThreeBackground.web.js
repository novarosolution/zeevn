import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { HOME_SCREEN_UI } from "../../content/appContent";
import useReducedMotion from "../../hooks/useReducedMotion";
import { useKankregLayout } from "../../theme/kankregBreakpoints";
import { getGsap } from "../../utils/loadGsap";
import { loadThree } from "../../utils/loadThree";
import { injectWebCssOnce } from "../../utils/injectWebCssOnce";

const HOST_CLASS = "zeevan-home-three-host";

injectWebCssOnce(
  "zeevan-home-three-host-styles",
  `.${HOST_CLASS} {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}
.${HOST_CLASS} canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}`
);

/**
 * Subtle emerald particle field + wireframe form behind the web home hero.
 * Loaded lazily; disabled on mobile web and when reduced motion is on.
 */
export default function WebHomeThreeBackground() {
  const hostRef = useRef(null);
  const reduced = useReducedMotion();
  const { isMobileWeb } = useKankregLayout();
  const enabled =
    HOME_SCREEN_UI.web?.showThreeBackground !== false && !reduced && !isMobileWeb;

  useEffect(() => {
    if (!enabled) return undefined;

    const host = hostRef.current;
    if (!host) return undefined;

    let disposed = false;
    let raf = 0;
    let renderer;
    let scene;
    let camera;
    let points;
    let wire;
    let resizeObserver;
    let onMove;

    (async () => {
      const THREE = await loadThree();
      if (!THREE || disposed || !hostRef.current) return;

      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 1.75));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);

      const canvas = renderer.domElement;
      canvas.setAttribute("aria-hidden", "true");
      host.appendChild(canvas);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 40);
      camera.position.z = 9;

      const count = 160;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        positions[i * 3] = (Math.random() - 0.5) * 16;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          color: 0x1f5c47,
          size: 0.055,
          transparent: true,
          opacity: 0.32,
          sizeAttenuation: true,
        })
      );
      scene.add(points);

      const ico = new THREE.IcosahedronGeometry(2.4, 1);
      wire = new THREE.Mesh(
        ico,
        new THREE.MeshBasicMaterial({
          color: 0x2a7559,
          wireframe: true,
          transparent: true,
          opacity: 0.1,
        })
      );
      wire.position.set(3.8, -0.4, -2.5);
      scene.add(wire);

      const gsap = await getGsap();
      if (gsap && !disposed) {
        onMove = (event) => {
          const nx = (event.clientX / globalThis.innerWidth - 0.5) * 0.45;
          const ny = (event.clientY / globalThis.innerHeight - 0.5) * 0.28;
          gsap.to(camera.position, {
            x: nx,
            y: -ny,
            duration: 1.4,
            ease: "power2.out",
            overwrite: "auto",
          });
        };
        globalThis.addEventListener("mousemove", onMove, { passive: true });
      }

      const tick = () => {
        if (disposed) return;
        points.rotation.y += 0.0007;
        points.rotation.x += 0.00035;
        wire.rotation.x += 0.0018;
        wire.rotation.y += 0.0012;
        renderer.render(scene, camera);
        raf = globalThis.requestAnimationFrame(tick);
      };
      tick();

      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          if (!hostRef.current || !renderer || !camera) return;
          const w = Math.max(hostRef.current.clientWidth, 1);
          const h = Math.max(hostRef.current.clientHeight, 1);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        });
        resizeObserver.observe(host);
      }
    })();

    return () => {
      disposed = true;
      if (raf) globalThis.cancelAnimationFrame(raf);
      if (onMove) globalThis.removeEventListener("mousemove", onMove);
      resizeObserver?.disconnect?.();
      if (renderer) {
        renderer.dispose?.();
        renderer.domElement?.remove?.();
      }
      scene?.traverse?.((obj) => {
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
        else obj.material?.dispose?.();
      });
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <View
      ref={hostRef}
      style={styles.host}
      // @ts-expect-error RN Web className
      className={HOST_CLASS}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});

import { Platform } from "react-native";
import { hapticSuccess } from "./haptics";

let ctx;

function getCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

/** Browsers block sound until a click. Call once after the first tap on the desk. */
export function unlockAdminNewOrderSound() {
  const audio = getCtx();
  if (audio?.state === "suspended") audio.resume().catch(() => {});
}

function beep(audio, start, freq, duration) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.14, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Short two-note ding — web desk. Phone admin gets a haptic instead. */
export function playAdminNewOrderSound() {
  hapticSuccess();
  if (Platform.OS !== "web") return;
  try {
    const audio = getCtx();
    if (!audio) return;
    if (audio.state === "suspended") audio.resume().catch(() => {});
    const t = audio.currentTime + 0.01;
    beep(audio, t, 880, 0.14);
    beep(audio, t + 0.13, 1175, 0.2);
  } catch {
    // Popup still shows if the browser blocks audio.
  }
}

import { useEffect, useState } from "react";

function formatElapsed(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Live elapsed timer from an ISO timestamp (or null when inactive). */
export default function useElapsedTimer(startedAt) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return undefined;
    }
    const startMs = new Date(startedAt).getTime();
    if (Number.isNaN(startMs)) {
      setElapsed(0);
      return undefined;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - startMs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return { seconds: elapsed, label: startedAt ? formatElapsed(elapsed) : "—" };
}

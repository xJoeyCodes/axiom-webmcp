"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  selectSingularityQuality,
  type SingularityQuality,
} from "./singularity-particles";
import styles from "./singularity.module.css";

const SingularityScene = dynamic(
  () => import("./singularity-scene").then((module) => module.SingularityScene),
  { ssr: false },
);

function subscribePreferences(update: () => void) {
  const queries = [
    "(min-width: 640px)",
    "(min-width: 1200px)",
    "(prefers-reduced-motion: reduce)",
  ];
  const media = queries.map((query) => window.matchMedia(query));
  media.forEach((query) => query.addEventListener("change", update));
  return () =>
    media.forEach((query) => query.removeEventListener("change", update));
}
function getPreferences() {
  const quality = selectSingularityQuality(
    window.innerWidth,
    navigator.hardwareConcurrency || 4,
  );
  return `${quality}:${window.matchMedia("(prefers-reduced-motion: reduce)").matches}`;
}

class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function SingularityHero() {
  const container = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const preferences = useSyncExternalStore(
    subscribePreferences,
    getPreferences,
    () => "low:true",
  );
  const [quality, reduced] = preferences.split(":");
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let intersects = false;
    function updateVisibility() {
      const active = intersects && document.visibilityState === "visible";
      setVisible(active);
      if (active) setMounted(true);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersects = entry.isIntersecting;
        updateVisibility();
      },
      { threshold: 0.01 },
    );
    observer.observe(element);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  return (
    <div
      ref={container}
      aria-hidden="true"
      className={`${styles.root} ${ready ? styles.ready : ""}`}
    >
      <div className={styles.fallback}>
        <div className={styles.stars} />
        <div className={styles.disk} />
        <div className={styles.void} />
      </div>
      {mounted && !failed ? (
        <div className={styles.canvas}>
          <SceneBoundary onFailure={onFailure}>
            <SingularityScene
              quality={quality as SingularityQuality}
              active={visible}
              reducedMotion={reduced === "true"}
              onReady={onReady}
              onFailure={onFailure}
            />
          </SceneBoundary>
        </div>
      ) : null}
      <div className={styles.veil} />
    </div>
  );
}

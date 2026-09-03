"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

const sceneQuery =
  "(min-width: 640px) and (prefers-reduced-motion: no-preference)";

const SingularityScene = dynamic(
  () =>
    import("@/components/hero/singularity-scene").then(
      (module) => module.SingularityScene,
    ),
  { ssr: false },
);

function subscribeToScenePreference(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(sceneQuery);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getScenePreference() {
  return window.matchMedia(sceneQuery).matches;
}

function getServerScenePreference() {
  return false;
}

export function SingularityHero() {
  const renderWebGl = useSyncExternalStore(
    subscribeToScenePreference,
    getScenePreference,
    getServerScenePreference,
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute top-[46%] left-1/2 aspect-square w-[min(112vw,960px)] -translate-x-1/2 -translate-y-1/2 opacity-70 sm:top-[44%] sm:w-[min(88vw,1040px)]">
        <div className="absolute inset-[10%] animate-[spin_52s_linear_infinite] rounded-full border border-white/[0.035]" />
        <div className="absolute inset-[21%] rotate-[18deg] [transform:rotate(18deg)_scaleY(.38)] animate-[spin_68s_linear_infinite_reverse] rounded-[50%] border border-white/[0.055]" />
        <div className="absolute inset-[30%] rounded-full border border-white/[0.07]" />
        <div className="absolute inset-[39%] rounded-full bg-[radial-gradient(circle_at_42%_38%,rgba(255,255,255,0.035),rgba(0,0,0,0.96)_58%)] shadow-[0_0_80px_rgba(255,255,255,0.025)]" />
        <div className="absolute top-1/2 right-[8%] left-[8%] h-px bg-linear-to-r from-transparent via-white/[0.09] to-transparent" />
      </div>

      {renderWebGl ? (
        <div className="absolute inset-0 opacity-80">
          <SingularityScene />
        </div>
      ) : null}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(9,10,12,0.12)_38%,#090a0c_76%)]" />
      <div className="to-background absolute inset-x-0 bottom-0 h-52 bg-linear-to-b from-transparent" />
    </div>
  );
}

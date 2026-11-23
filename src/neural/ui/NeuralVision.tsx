import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { live } from "../store";
import { Chrome } from "./Chrome";
import { DetectionOverlay, InfoPanel, RelationLabels } from "./DetectionOverlay";
import { Beyond, Finale, Hero, Intelligence, Perception } from "./Sections";

const Experience = lazy(() => import("../scene/Experience"));

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? <StaticBackdrop /> : this.props.children;
  }
}

function StaticBackdrop() {
  return (
    <div
      className="absolute inset-0"
      style={{ background: "radial-gradient(60% 50% at 50% 45%, color-mix(in oklab, var(--cyan) 18%, transparent), transparent 70%)" }}
    />
  );
}

export function NeuralVision() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    live.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & { deviceMemory?: number };
    live.lowPower =
      (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 || window.matchMedia("(max-width: 768px)").matches;

    const onScroll = () => {
      live.t = window.scrollY / window.innerHeight;
    };
    const onMove = (e: PointerEvent) => {
      live.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      live.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    onScroll();
    live.ts = live.t;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    setMounted(true);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <main className="grain relative bg-background text-foreground">
      <div data-scene-root className="fixed inset-0 z-0" aria-hidden>
        <StaticBackdrop />
        {mounted && (
          <SceneBoundary>
            <Suspense fallback={null}>
              <div className="absolute inset-0">
                <Experience />
              </div>
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      <Chrome />
      <DetectionOverlay />
      <RelationLabels />
      <InfoPanel />
      <div className="relative z-10">
        <Hero />
        <Perception />
        <Intelligence />
        <Beyond />
        <Finale />
      </div>
    </main>
  );
}

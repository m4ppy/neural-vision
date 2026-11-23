import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { OBJECTS, RELATIONS } from "../data";
import { live, ui, useUi } from "../store";

/** Screen-space detection boxes; positions are written every frame by the 3D world. */
export function DetectionOverlay() {
  const hovered = useUi((s) => s.hovered);
  return (
    <div
      ref={(el) => { live.els.overlay = el; }}
      data-active="false"
      className="group/ov pointer-events-none fixed inset-0 z-20 opacity-0"
      aria-label="Conceptual object detection simulation"
    >
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        {OBJECTS.map((o) => (
          <line
            key={o.id}
            ref={(el) => { if (el) live.els.lineEls[o.id] = el; }}
            className="stroke-lime"
            strokeWidth={1}
            strokeDasharray="2 6"
            opacity={0}
          />
        ))}
      </svg>
      {OBJECTS.map((o, i) => (
        <button
          type="button"
          key={o.id}
          ref={(el) => {
            if (el) live.els.boxes[o.id] = { root: el, meta: el.querySelector<HTMLSpanElement>("[data-meta]") };
          }}
          data-state={hovered === o.id ? "hot" : hovered ? "dim" : undefined}
          className="det-box invisible cursor-crosshair transition-opacity duration-500 group-data-[active=true]/ov:pointer-events-auto focus-visible:outline-none"
          onPointerEnter={() => ui.set({ hovered: o.id })}
          onPointerLeave={() => ui.set({ hovered: null })}
          onFocus={() => ui.set({ hovered: o.id })}
          onBlur={() => ui.set({ hovered: null })}
          onClick={() => ui.set({ selected: o.id })}
          aria-label={`Inspect ${o.label}`}
        >
          <span className="absolute -top-6 left-0 flex items-center gap-2 whitespace-nowrap">
            <span className="label-mono bg-[var(--c)] px-1.5 py-0.5 text-primary-foreground transition-colors duration-300">
              {o.label}
            </span>
            <span data-meta className="label-mono text-[var(--c)]">
              {o.confidence.toFixed(2)}
            </span>
          </span>
          <span className="absolute -bottom-5 left-0 label-mono text-[0.6rem] text-faint">
            {o.trackId} · {String(i + 1).padStart(2, "0")}
          </span>
          <span className="absolute inset-x-0 bottom-0 h-px bg-border">
            <span className="block h-full bg-[var(--c)]" style={{ width: `${o.confidence * 100}%` }} />
          </span>
          <span className="absolute inset-0 overflow-hidden">
            <span className="scanline absolute inset-x-0 h-1/3" />
          </span>
        </button>
      ))}
    </div>
  );
}

export function InfoPanel() {
  const selected = useUi((s) => s.selected);
  const obj = OBJECTS.find((o) => o.id === selected);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && ui.set({ selected: null });
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <AnimatePresence>
      {obj && (
        <motion.aside
          key={obj.id}
          initial={{ opacity: 0, x: 40, filter: "blur(8px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: 30, filter: "blur(6px)" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass fixed right-4 top-24 z-50 w-[min(22rem,calc(100vw-2rem))] p-6 md:right-10"
          role="dialog"
          aria-label={`${obj.label} details`}
        >
          <div className="flex items-start justify-between">
            <p className="label-mono text-cyan">
              {obj.trackId} · simulated
            </p>
            <button
              type="button"
              onClick={() => ui.set({ selected: null })}
              className="label-mono text-muted-foreground transition-colors hover:text-foreground"
            >
              Close ✕
            </button>
          </div>
          <h3 className="mt-5 text-4xl font-bold tracking-tight">{obj.label}</h3>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border">
              <motion.div
                className="h-px bg-lime"
                initial={{ width: 0 }}
                animate={{ width: `${obj.confidence * 100}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              />
            </div>
            <span className="label-mono text-lime">{Math.round(obj.confidence * 100)}%</span>
          </div>
          <dl className="mt-6 space-y-4 text-sm leading-relaxed">
            <div>
              <dt className="label-mono text-faint">Observation</dt>
              <dd className="mt-1 text-foreground/85">{obj.note}</dd>
            </div>
            <div>
              <dt className="label-mono text-faint">Context</dt>
              <dd className="mt-1 text-foreground/85">{obj.context}</dd>
            </div>
            <div>
              <dt className="label-mono text-faint">Distance from wearer</dt>
              <dd className="mt-1 font-mono text-foreground/85">≈ {(live.distances[obj.id] ?? 0).toFixed(1)} m</dd>
            </div>
          </dl>
          <p className="mt-6 border-t border-border pt-4 label-mono text-[0.6rem] text-faint">
            Conceptual visualization — no real AI inference is running.
          </p>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/** Relation labels for scene understanding; projected every frame by the 3D world. */
export function RelationLabels() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[5]" aria-hidden>
      {RELATIONS.map(([a, b, rel], k) => (
        <div
          key={rel + k}
          ref={(el) => { live.els.relEls[k] = el; }}
          className="label-mono glass absolute left-0 top-0 whitespace-nowrap px-2 py-1 text-ice opacity-0"
        >
          {a} <span className="text-lime">— {rel} →</span> {b}
        </div>
      ))}
    </div>
  );
}

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { CONCEPTS, MODES, OBJECTS, SCENE_CAPTION } from "../data";
import { live, ui, useUi } from "../store";
import { SECTIONS } from "../timeline";
import { scrollToT } from "./Chrome";
import { Magnetic } from "./Magnetic";
import { Reveal } from "./Reveal";

const EASE = [0.16, 1, 0.3, 1] as const;

function Section({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  const s = SECTIONS.find((x) => x.id === id)!;
  return (
    <section id={id} className="relative" style={{ height: `${s.height * 100}vh` }}>
      <div className={`sticky top-0 h-svh w-full overflow-hidden ${className ?? ""}`}>{children}</div>
    </section>
  );
}

function SceneTag({ index, label }: { index: string; label: string }) {
  return (
    <p className="label-mono flex items-center gap-3 text-muted-foreground">
      <span className="text-cyan">Scene {index}</span>
      <span className="h-px w-8 bg-faint" />
      {label}
    </p>
  );
}

export function Hero() {
  return (
    <Section id="awaken">
      <div ref={(el) => { live.els.hero = el; }} className="pointer-events-none relative h-full w-full will-change-transform">
        <div className="absolute left-5 top-24 md:left-10 md:top-28">
          <SceneTag index="01" label="Awaken" />
        </div>
        <div className="label-mono absolute right-5 top-24 hidden text-right text-faint md:right-24 md:top-28 md:block">
          <p>Optical array · standby</p>
          <p className="mt-1">Field of view 104°</p>
          <p className="mt-1">Frame 000001</p>
        </div>
        <div className="absolute inset-x-5 bottom-24 md:inset-x-10 md:bottom-16">
          <Reveal as="h1" onLoad delay={0.35} text={"VISION\nBEYOND HUMAN."} className="display-xl text-glow" />
          <div className="mt-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <Reveal onLoad by="word" delay={1.1} text="An exploration of artificial perception." className="label-mono max-w-xs text-muted-foreground" />
            <div className="hidden items-center gap-4 md:flex">
              <span className="label-mono text-faint">Scroll to enter the lens</span>
              <span className="relative block h-14 w-px overflow-hidden bg-border">
                <span className="scroll-cue absolute inset-0 bg-cyan" />
              </span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 md:hidden">
          <span className="relative block h-10 w-px overflow-hidden bg-border">
            <span className="scroll-cue absolute inset-0 bg-cyan" />
          </span>
        </div>
      </div>
    </Section>
  );
}

export function Perception() {
  const hovered = useUi((s) => s.hovered);
  const obj = OBJECTS.find((o) => o.id === hovered);
  return (
    <Section id="perception" className="pointer-events-none">
      <div className="hud-corners absolute inset-4 md:inset-8" aria-hidden />
      <div className="absolute left-5 top-24 max-w-xl md:left-12 md:top-28">
        <SceneTag index="02" label="Perception" />
        <Reveal as="h2" text={"THE WORLD,\nANNOTATED."} className="mt-6 text-4xl font-bold leading-[0.9] tracking-[-0.045em] md:text-6xl" />
      </div>
      <div className="absolute bottom-10 left-5 max-w-sm md:bottom-14 md:left-12">
        <Reveal
          by="word"
          as="p"
          text="Through the lens, every surface becomes data. Objects are found, named, scored and followed from frame to frame."
          className="text-base leading-snug text-foreground/80 md:text-lg"
        />
        <p className="label-mono mt-6 inline-flex items-center gap-2 border border-lime/40 px-2.5 py-1.5 text-lime">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" /> Conceptual detection simulation — not real AI inference
        </p>
      </div>
      <div className="label-mono absolute bottom-14 right-24 hidden text-right md:block">
        <AnimatePresence mode="wait">
          <motion.div
            key={obj?.id ?? "idle"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {obj ? (
              <>
                <p className="text-faint">Focus locked</p>
                <p className="mt-1 text-2xl normal-case tracking-tight text-lime">{obj.label}</p>
                <p className="mt-1 text-muted-foreground">
                  {obj.trackId} · conf {obj.confidence.toFixed(2)} · click to inspect
                </p>
              </>
            ) : (
              <>
                <p className="text-faint">5 objects tracked</p>
                <p className="mt-1 text-muted-foreground">Hover an object · click to inspect</p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Section>
  );
}

export function Intelligence() {
  const concept = useUi((s) => s.concept);
  const active = CONCEPTS.find((c) => c.id === concept);
  return (
    <Section id="intelligence">
      <div data-concept={concept ?? "yolo"} className="relative h-full w-full">
        <div className="pointer-events-none absolute left-5 top-24 md:left-12 md:top-28">
          <SceneTag index="03" label="Intelligence" />
          <Reveal as="h2" text={"INSIDE THE MIND\nOF A MACHINE."} className="mt-6 text-4xl font-bold leading-[0.9] tracking-[-0.045em] md:text-6xl" />
        </div>
        <ul className="absolute bottom-32 left-5 right-5 md:bottom-auto md:left-12 md:right-auto md:top-1/2 md:mt-4" onMouseLeave={() => ui.set({ concept: null })}>
          {CONCEPTS.map((c, i) => {
            const on = concept === c.id;
            const dim = concept !== null && !on;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onMouseEnter={() => ui.set({ concept: c.id })}
                  onFocus={() => ui.set({ concept: c.id })}
                  onClick={() => ui.set({ concept: on ? null : c.id })}
                  className="group flex items-baseline gap-4 py-1.5 text-left md:gap-6"
                  aria-pressed={on}
                >
                  <span className={`label-mono transition-colors duration-500 ${on ? "text-concept" : "text-faint"}`}>0{i + 1}</span>
                  <span
                    className={`font-display text-4xl font-bold tracking-[-0.05em] transition-all duration-700 md:text-7xl ${
                      on ? "translate-x-3 text-concept" : dim ? "text-foreground/20" : "text-foreground"
                    }`}
                  >
                    {c.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="pointer-events-none absolute bottom-10 left-5 right-5 md:bottom-14 md:left-auto md:right-24 md:w-[22rem]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active?.id ?? "none"}
              initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              {active ? (
                <div className="glass p-5">
                  <p className="label-mono text-concept">{active.tagline}</p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/85 md:text-base">{active.body}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {active.stats.map((s) => (
                      <span key={s} className="label-mono border border-border px-2 py-1 text-[0.6rem] text-muted-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="label-mono hidden text-faint md:block">Hover an architecture to rewire the network</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
}

function Typed({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (live.reduced) { setN(text.length); return; }
    setN(0);
    const id = window.setInterval(() => setN((v) => (v >= text.length ? v : v + 2)), 22);
    return () => window.clearInterval(id);
  }, [text]);
  return (
    <span>
      {text.slice(0, n)}
      <span className="blink ml-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[0.15em] bg-cyan" />
    </span>
  );
}

export function Beyond() {
  const mode = useUi((s) => s.mode);
  const m = MODES[mode] ?? MODES[0];
  return (
    <Section id="beyond">
      <div className="hud-corners pointer-events-none absolute inset-4 md:inset-8" aria-hidden />
      <div className="pointer-events-none absolute left-5 top-24 md:left-12 md:top-28">
        <SceneTag index="04" label="Beyond perception" />
        <Reveal as="h2" text={"CONTEXT,\nNOT CONTENT."} className="mt-6 text-4xl font-bold leading-[0.9] tracking-[-0.045em] md:text-6xl" />
      </div>

      <div className="absolute right-5 top-56 w-[min(20rem,calc(100vw-2.5rem))] md:right-24 md:top-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={m.id}
            className="glass p-5"
            initial={{ opacity: 0, y: 16, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, y: -8, clipPath: "inset(100% 0 0 0)" }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p className="label-mono flex justify-between text-faint">
              <span>Simulated feedback</span>
              <span className="text-cyan">0{mode + 1}</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">{m.summary}</p>
            <ul className="mt-4 hidden space-y-1.5 md:block">
              {m.feed.map((f, i) => (
                <motion.li
                  key={f}
                  className="label-mono text-[0.62rem] text-muted-foreground"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.12, duration: 0.5, ease: EASE }}
                >
                  <span className="text-lime">›</span> {f}
                </motion.li>
              ))}
            </ul>
            {m.id === "obstacle" && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="label-mono text-faint">Nearest obstacle</p>
                <p ref={(el) => { live.els.nearest = el; }} className="mt-1 font-mono text-lg text-signal">—</p>
              </div>
            )}
            {m.id === "scene" && (
              <p className="mt-4 border-t border-border pt-3 font-mono text-xs leading-relaxed text-ice">
                <Typed text={SCENE_CAPTION} />
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute inset-x-0 bottom-10 flex justify-center px-4 md:bottom-14" role="tablist" aria-label="AI glasses modes">
        <div className="glass flex gap-1 p-1">
          {MODES.map((md, i) => {
            const on = i === mode;
            return (
              <Magnetic key={md.id} strength={0.25}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => ui.set({ mode: i, hovered: null })}
                  className={`relative px-3 py-2.5 md:px-5 md:py-3 label-mono transition-colors duration-300 ${
                    on ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {on && (
                    <motion.span layoutId="mode-pill" className="absolute inset-0 bg-cyan" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                  )}
                  <span className="relative">
                    <span className="md:hidden">{md.short}</span>
                    <span className="hidden md:inline">{md.name}</span>
                  </span>
                </button>
              </Magnetic>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

export function Finale() {
  return (
    <Section id="finale">
      <div className="flex h-full flex-col items-center justify-center px-5 text-center">
        <p className="label-mono text-cyan">Scene 05 — Context</p>
        <Reveal as="h2" text={"THE FUTURE IS\nCONTEXT-AWARE."} className="display-lg mt-8 text-glow" />
        <Reveal by="word" delay={0.4} as="p" text="From seeing the world to understanding it." className="mt-8 text-lg text-foreground/80 md:text-2xl" />
        <div className="mt-14">
          <Magnetic>
            <button
              type="button"
              onClick={() => scrollToT(0)}
              className="label-mono border border-border px-6 py-3.5 text-foreground transition-colors duration-300 hover:border-cyan hover:text-cyan"
            >
              ↑ Return to awaken
            </button>
          </Magnetic>
        </div>
      </div>
      <footer className="label-mono absolute inset-x-5 bottom-8 flex flex-col justify-between gap-2 text-faint md:inset-x-10 md:flex-row">
        <span>Neural Vision — an interactive exhibition on artificial perception</span>
        <span>All detections are simulated for illustration</span>
      </footer>
    </Section>
  );
}

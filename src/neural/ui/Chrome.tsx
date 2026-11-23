import { SECTIONS, SECTION_START } from "../timeline";
import { live, useUi } from "../store";
import { Magnetic } from "./Magnetic";

export function scrollToT(t: number) {
  window.scrollTo({ top: t * window.innerHeight, behavior: live.reduced ? "auto" : "smooth" });
}

/** Persistent exhibition frame: wordmark, chapter, chapter rail and progress. */
export function Chrome() {
  const chapter = useUi((s) => s.chapter);
  const current = SECTIONS[chapter] ?? SECTIONS[0];
  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
        <Magnetic className="pointer-events-auto">
          <button type="button" onClick={() => scrollToT(0)} className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan" />
            </span>
            <span className="label-mono text-foreground">Neural Vision</span>
          </button>
        </Magnetic>
        <div className="label-mono flex items-center gap-4 text-muted-foreground">
          <span className="hidden md:inline">Sim mode · no live inference</span>
          <span className="text-foreground">
            <span className="text-cyan">{current.index}</span> / {current.label}
          </span>
        </div>
      </header>

      <nav className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-4 md:right-10 md:flex" aria-label="Scenes">
        {SECTIONS.map((s, i) => (
          <Magnetic key={s.id} strength={0.5}>
            <button
              type="button"
              onClick={() => scrollToT(SECTION_START[s.id] + (i === 0 ? 0 : 0.02))}
              className="group flex items-center gap-3 py-1"
              aria-label={`Go to ${s.label}`}
            >
              <span
                className={`label-mono transition-all duration-500 ${
                  i === chapter ? "text-foreground opacity-100" : "translate-x-2 text-muted-foreground opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                }`}
              >
                {s.label}
              </span>
              <span
                className={`block h-px transition-all duration-500 ${i === chapter ? "w-10 bg-cyan" : "w-4 bg-faint group-hover:w-7"}`}
              />
            </button>
          </Magnetic>
        ))}
      </nav>

      <div className="fixed inset-x-0 bottom-0 z-40 h-px bg-border">
        <div ref={(el) => { live.els.progress = el; }} className="h-full origin-left scale-x-0 bg-cyan" />
      </div>

      <div
        ref={(el) => { live.els.flash = el; }}
        className="pointer-events-none fixed inset-0 z-30 opacity-0"
        style={{ background: "radial-gradient(circle at 50% 50%, var(--ice) 0%, var(--cyan) 30%, transparent 75%)" }}
        aria-hidden
      />
      <div className="vignette pointer-events-none fixed inset-0 z-[1]" aria-hidden />
    </>
  );
}

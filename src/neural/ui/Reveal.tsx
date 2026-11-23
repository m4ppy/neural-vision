import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef, type ElementType } from "react";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

interface Props {
  text: string;
  as?: ElementType;
  className?: string;
  by?: "char" | "word";
  delay?: number;
  stagger?: number;
  onLoad?: boolean;
}

/** Masked, staggered text reveal. Lines split on "\n". */
export function Reveal({ text, as: Tag = "span", className, by = "char", delay = 0, stagger, onLoad = false }: Props) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const targets = el.querySelectorAll("[data-r]");
      if (reduced) {
        gsap.to(targets, { opacity: 1, duration: 0.6, delay });
        return;
      }
      gsap.fromTo(
        targets,
        { yPercent: 118, opacity: 0, rotateZ: by === "char" ? 7 : 2 },
        {
          yPercent: 0,
          opacity: 1,
          rotateZ: 0,
          duration: by === "char" ? 1.25 : 1.05,
          ease: "expo.out",
          stagger: stagger ?? (by === "char" ? 0.028 : 0.05),
          delay,
          ...(onLoad ? {} : { scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" } }),
        },
      );
    }, el);
    return () => ctx.revert();
  }, [by, delay, stagger, onLoad, text]);

  const lines = text.split("\n");
  return (
    <Tag ref={ref} className={cn("block", className)} aria-label={text.replace(/\n/g, " ")}>
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden>
          {line.split(" ").map((word, wi) => (
            <span key={wi} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
              {by === "word" ? (
                <span data-r className="inline-block origin-bottom-left opacity-0">
                  {word}
                </span>
              ) : (
                Array.from(word).map((ch, ci) => (
                  <span key={ci} data-r className="inline-block origin-bottom-left opacity-0">
                    {ch}
                  </span>
                ))
              )}
              {wi < line.split(" ").length - 1 && <span className="inline-block">&nbsp;</span>}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}

// Shared scroll choreography. Pure TS: no React, no three.js.
// Scroll position is measured in viewport heights ("t"). Section heights here
// drive both the DOM layout and the 3D camera, so they never drift apart.

export const SECTIONS = [
  { id: "awaken", index: "01", label: "Awaken", height: 1.6 },
  { id: "perception", index: "02", label: "Perception", height: 2.6 },
  { id: "intelligence", index: "03", label: "Intelligence", height: 2.4 },
  { id: "beyond", index: "04", label: "Beyond Perception", height: 2.6 },
  { id: "finale", index: "05", label: "Context", height: 1.6 },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

export const SECTION_START: Record<SectionId, number> = (() => {
  let acc = 0;
  const out = {} as Record<SectionId, number>;
  for (const s of SECTIONS) {
    out[s.id] = acc;
    acc += s.height;
  }
  return out;
})();

export const TOTAL_HEIGHT = SECTIONS.reduce((a, s) => a + s.height, 0);
export const MAX_T = TOTAL_HEIGHT - 1;

/** Moment the camera passes through the lens and the world swaps in. */
export const LENS_T = 1.45;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smoothstep = (a: number, b: number, x: number) => {
  const k = clamp01((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** 0 outside [a,d], ramps up a→b, holds, ramps down c→d. */
export const windowed = (a: number, b: number, c: number, d: number, x: number) =>
  smoothstep(a, b, x) * (1 - smoothstep(c, d, x));

export function sectionAt(t: number): number {
  let idx = 0;
  SECTIONS.forEach((s, i) => {
    if (t + 0.5 >= SECTION_START[s.id]) idx = i;
  });
  return idx;
}

type V3 = readonly [number, number, number];
interface Key {
  t: number;
  pos: V3;
  look: V3;
}

// Camera path. A gap between two keys of < 0.02 marks a hard cut (hidden by the lens flash).
export const CAMERA_KEYS: readonly Key[] = [
  { t: 0, pos: [0, -0.25, 6.4], look: [0, -0.5, 0] },
  { t: 0.2, pos: [0, -0.22, 6.2], look: [0, -0.45, 0] },
  { t: LENS_T, pos: [-0.86, 0.02, 0.32], look: [-0.86, 0.02, -2] },
  { t: LENS_T + 0.01, pos: [-3.6, 2.7, 9.5], look: [0, 0.9, 0] },
  { t: 1.95, pos: [-1.5, 1.7, 7.2], look: [0, 0.9, 0] },
  { t: 3.6, pos: [1.5, 1.7, 6.4], look: [0.3, 0.9, -0.5] },
  { t: 4.6, pos: [0, 27, 13.5], look: [0, 28, 0] },
  { t: 5.6, pos: [0, 28, 11.8], look: [0, 28, 0] },
  { t: 6.7, pos: [2.6, 1.75, 5.8], look: [0.5, 0.8, -0.5] },
  { t: 8.2, pos: [1.3, 1.7, 3.9], look: [0.4, 0.8, -0.8] },
  { t: 9.3, pos: [0, 7.5, 15], look: [0, 1.2, 0] },
  { t: MAX_T, pos: [0, 9.5, 19], look: [0, 1.6, 0] },
];

export function cameraAt(t: number): { pos: [number, number, number]; look: [number, number, number] } {
  const keys = CAMERA_KEYS;
  const first = keys[0]!;
  const last = keys[keys.length - 1]!;
  if (t <= first.t) return { pos: [...first.pos], look: [...first.look] };
  if (t >= last.t) return { pos: [...last.pos], look: [...last.look] };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]!;
    const b = keys[i + 1]!;
    if (t >= a.t && t <= b.t) {
      const k = smoothstep(a.t, b.t, t);
      return {
        pos: [lerp(a.pos[0], b.pos[0], k), lerp(a.pos[1], b.pos[1], k), lerp(a.pos[2], b.pos[2], k)],
        look: [lerp(a.look[0], b.look[0], k), lerp(a.look[1], b.look[1], k), lerp(a.look[2], b.look[2], k)],
      };
    }
  }
  return { pos: [...last.pos], look: [...last.look] };
}

/** Visibility weights for each scene layer at scroll t. */
export function layersAt(t: number) {
  const pStart = SECTION_START.perception;
  const iStart = SECTION_START.intelligence;
  const bStart = SECTION_START.beyond;
  const fStart = SECTION_START.finale;
  return {
    hero: 1 - smoothstep(0.15, 0.85, t),
    glasses: t < LENS_T + 0.005 ? 1 : 0,
    world: t > LENS_T ? 1 : 0,
    flash: Math.exp(-(((t - LENS_T) / 0.09) ** 2)),
    perceptionOverlay: windowed(pStart + 0.05, pStart + 0.35, pStart + 1.75, pStart + 2.15, t),
    neural: windowed(iStart - 0.5, iStart + 0.2, iStart + 1.5, iStart + 2.1, t),
    beyond: windowed(bStart - 0.15, bStart + 0.2, bStart + 1.7, bStart + 2.2, t),
    finale: smoothstep(fStart - 0.6, fStart + 0.2, t),
  };
}

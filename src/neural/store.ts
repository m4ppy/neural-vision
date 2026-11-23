import { useSyncExternalStore } from "react";
import type { ConceptId } from "./data";

/**
 * Two kinds of shared state:
 * - `live`: per-frame values (scroll, cursor, DOM handles) mutated outside React.
 * - `ui`: discrete choices the interface switches on (hover, selection, concept, mode).
 */
export interface BoxEls {
  root: HTMLElement;
  meta: HTMLSpanElement | null;
}

export const live = {
  t: 0,
  ts: 0,
  mouse: { x: 0, y: 0 },
  mouseS: { x: 0, y: 0 },
  pulse: 0,
  reduced: false,
  lowPower: false,
  ready: false,
  distances: {} as Record<string, number>,
  els: {
    hero: null as HTMLElement | null,
    flash: null as HTMLElement | null,
    overlay: null as HTMLElement | null,
    lineEls: {} as Record<string, SVGLineElement>,
    relEls: [] as (HTMLDivElement | null)[],
    nearest: null as HTMLElement | null,
    progress: null as HTMLElement | null,
    boxes: {} as Record<string, BoxEls>,
  },
};

export interface UiState {
  hovered: string | null;
  selected: string | null;
  concept: ConceptId | null;
  mode: number;
  chapter: number;
}

let state: UiState = { hovered: null, selected: null, concept: null, mode: 0, chapter: 0 };
const listeners = new Set<() => void>();

export const ui = {
  get: () => state,
  set(patch: Partial<UiState>) {
    let changed = false;
    for (const k of Object.keys(patch) as (keyof UiState)[]) {
      if (state[k] !== patch[k]) changed = true;
    }
    if (!changed) return;
    state = { ...state, ...patch };
    if (patch.hovered) live.pulse = 1;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useUi<T>(sel: (s: UiState) => T): T {
  return useSyncExternalStore(
    ui.subscribe,
    () => sel(state),
    () => sel(state),
  );
}

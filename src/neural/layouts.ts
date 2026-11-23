// Node layouts for the neural visualization. Pure TS (no three.js), seeded for stable output.

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r: () => number) {
  const u = Math.max(r(), 1e-6);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

/** Calm resting cloud: a fibonacci sphere with breathing depth. */
export function layoutNeutral(n: number): Float32Array {
  const r = rng(7);
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    const R = 2.6 + r() * 1.1;
    out[i * 3] = Math.cos(th) * rad * R;
    out[i * 3 + 1] = y * R;
    out[i * 3 + 2] = Math.sin(th) * rad * R;
  }
  return out;
}

/** YOLO: a feature pyramid of grids, layer after layer. */
export function layoutYolo(n: number): Float32Array {
  const out = new Float32Array(n * 3);
  const layers = [3.2, 2.6, 2.0, 1.45, 0.95];
  const weights = [0.32, 0.25, 0.19, 0.14, 0.1];
  let idx = 0;
  layers.forEach((half, li) => {
    const count = li === layers.length - 1 ? n - idx : Math.round(n * (weights[li] ?? 0));
    const cols = Math.ceil(Math.sqrt(count));
    for (let k = 0; k < count && idx < n; k++, idx++) {
      const cx = k % cols;
      const cy = Math.floor(k / cols);
      out[idx * 3] = -4.4 + li * 2.2;
      out[idx * 3 + 1] = -half + (cy / Math.max(cols - 1, 1)) * half * 2;
      out[idx * 3 + 2] = -half + (cx / Math.max(cols - 1, 1)) * half * 2;
    }
  });
  return out;
}

/** SpikeYOLO: sparse neuron assemblies. */
export function layoutSpike(n: number): Float32Array {
  const r = rng(21);
  const out = new Float32Array(n * 3);
  const centers: [number, number, number][] = [];
  for (let c = 0; c < 11; c++) {
    const th = r() * Math.PI * 2;
    const ph = Math.acos(2 * r() - 1);
    const R = 1.6 + r() * 2.2;
    centers.push([Math.sin(ph) * Math.cos(th) * R * 1.3, Math.cos(ph) * R * 0.85, Math.sin(ph) * Math.sin(th) * R]);
  }
  for (let i = 0; i < n; i++) {
    const c = centers[i % centers.length]!;
    out[i * 3] = c[0] + gauss(r) * 0.38;
    out[i * 3 + 1] = c[1] + gauss(r) * 0.38;
    out[i * 3 + 2] = c[2] + gauss(r) * 0.38;
  }
  return out;
}

/** Vision-language: two token streams braided into a shared helix. */
export function layoutVlm(n: number): Float32Array {
  const r = rng(42);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const strand = i % 2;
    const u = (i / n) * 2 - 1;
    const ang = u * Math.PI * 3.2 + strand * Math.PI;
    const R = 1.5 + 0.6 * Math.cos(u * Math.PI) + r() * 0.15;
    out[i * 3] = u * 5;
    out[i * 3 + 1] = Math.cos(ang) * R;
    out[i * 3 + 2] = Math.sin(ang) * R;
  }
  return out;
}

/** k-nearest-neighbour index pairs, de-duplicated. */
export function nearestPairs(pos: Float32Array, k: number, maxDist: number): Uint16Array {
  const n = pos.length / 3;
  const seen = new Set<number>();
  const pairs: number[] = [];
  const md2 = maxDist * maxDist;
  for (let i = 0; i < n; i++) {
    const best: [number, number][] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = pos[i * 3]! - pos[j * 3]!;
      const dy = pos[i * 3 + 1]! - pos[j * 3 + 1]!;
      const dz = pos[i * 3 + 2]! - pos[j * 3 + 2]!;
      const d = dx * dx + dy * dy + dz * dz;
      if (d > md2) continue;
      if (best.length < k) {
        best.push([d, j]);
        best.sort((a, b) => a[0] - b[0]);
      } else if (d < best[k - 1]![0]) {
        best[k - 1] = [d, j];
        best.sort((a, b) => a[0] - b[0]);
      }
    }
    for (const [, j] of best) {
      const key = i < j ? i * 65536 + j : j * 65536 + i;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push(i, j);
    }
  }
  return new Uint16Array(pairs);
}

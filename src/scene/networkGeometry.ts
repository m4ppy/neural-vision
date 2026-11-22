import type { Technology } from '../technologies'

type Point = readonly [number, number, number]
const goldenAngle = Math.PI * (3 - Math.sqrt(5))
export const nodeCount = 144
export const particleCount = 1850

function noise(index: number) {
  const value = Math.sin(index * 127.1 + 18.7) * 43758.5453
  return value - Math.floor(value)
}

function sphere(index: number): Point {
  const y = 1 - index / (particleCount - 1) * 2
  const size = Math.sqrt(1 - y * y)
  const angle = index * goldenAngle
  return [Math.cos(angle) * size, y, Math.sin(angle) * size]
}

const directions = Array.from({ length: particleCount }, (_, i) => sphere((i * 947) % particleCount))

function position(mode: Technology['id'], index: number): Point {
  const [x, y, z] = directions[index]
  const jitter = noise(index * 3.78)
  const r = index < nodeCount ? 2.04 + jitter * 0.45 : 1.33 + jitter ** 0.4 * 1.31
  if (mode === 'spikeyolo') {
    const wave = 0.46 + Math.abs(Math.cos(y * 11 + z * 1.6)) * 0.68
    return [x * r * wave + Math.sin(y * 8) * 0.57, y * 2.45, z * r * wave * 0.82]
  }
  if (mode === 'vlm') {
    const half = index % 2 === 0 ? -1 : 1
    const spread = index % 13 < 2 ? 0.32 : 1.15
    return [x * r * 0.61 + half * spread, y * r * 0.72 + half * 0.27, z * r * 0.69]
  }
  return [x * r * 1.04, y * r * 0.91, z * r]
}

export const networkPositions = {
  yolo: directions.map((_, index) => position('yolo', index)),
  spikeyolo: directions.map((_, index) => position('spikeyolo', index)),
  vlm: directions.map((_, index) => position('vlm', index)),
}

function neighbors(nodes: Point[]) {
  const edges = new Map<string, readonly [number, number]>()
  const hubs = nodes.slice(0, nodeCount)
  hubs.forEach(([x, y, z], index) => {
    const nearest = hubs
      .map(([nx, ny, nz], candidate) => ({ candidate, distance: (x - nx) ** 2 + (y - ny) ** 2 + (z - nz) ** 2 }))
      .filter(({ candidate }) => candidate !== index)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 4)
    nearest.forEach(({ candidate }) => {
      const a = Math.min(index, candidate)
      const b = Math.max(index, candidate)
      edges.set(`${a}:${b}`, [a, b])
    })
  })
  return [...edges.values()]
}

export const networkEdges = {
  yolo: neighbors(networkPositions.yolo),
  spikeyolo: neighbors(networkPositions.spikeyolo),
  vlm: neighbors(networkPositions.vlm),
}

export const maxEdges = Math.max(...Object.values(networkEdges).map((edges) => edges.length))

export const particleSizes = Float32Array.from({ length: particleCount }, (_, i) =>
  i < nodeCount ? 1.8 + noise(i) * 2.7 : 0.7 + noise(i) ** 2 * 1.9,
)

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { layoutNeutral, layoutSpike, layoutVlm, layoutYolo, nearestPairs } from "../layouts";
import { PALETTE } from "../palette";
import { live, ui } from "../store";
import { layersAt } from "../timeline";
import { makeDotTexture, makeGlowTexture } from "./textures";

const KINDS = ["neutral", "yolo", "spike", "vlm"] as const;
const COLORS = [PALETTE.cyan, PALETTE.cyan, PALETTE.lime, PALETTE.ice].map((c) => new THREE.Color(c));

/** The machine's mind: one node set morphing between four architectures. */
export function NeuralNet() {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const pointsMat = useRef<THREE.PointsMaterial>(null);
  const coreMat = useRef<THREE.MeshBasicMaterial>(null);
  const lineRefs = useRef<(THREE.LineSegments | null)[]>([]);
  const { viewport } = useThree();

  const data = useMemo(() => {
    const n = live.lowPower ? 260 : 520;
    const layouts = [layoutNeutral(n), layoutYolo(n), layoutSpike(n), layoutVlm(n)];
    const pairs = [
      nearestPairs(layouts[0]!, 2, 1.4),
      nearestPairs(layouts[1]!, 2, 1.1),
      nearestPairs(layouts[2]!, 3, 0.7),
      nearestPairs(layouts[3]!, 2, 0.9),
    ];
    const cur = new Float32Array(layouts[0]!);
    const col = new Float32Array(n * 3);
    const spikes = new Float32Array(n);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(cur, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const lineGeos = pairs.map((p) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(p.length * 3), 3));
      return g;
    });
    return { n, layouts, pairs, cur, col, spikes, geo, lineGeos, weights: [1, 0, 0, 0], dot: makeDotTexture(), glow: makeGlowTexture() };
  }, []);

  useEffect(
    () => () => {
      data.geo.dispose();
      data.lineGeos.forEach((g) => g.dispose());
      data.dot.dispose();
      data.glow.dispose();
    },
    [data],
  );

  const mixColor = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }, rawDelta) => {
    const g = group.current;
    const s = spin.current;
    if (!g || !s) return;
    const L = layersAt(live.ts);
    const vis = L.neural;
    g.visible = vis > 0.005;
    if (!g.visible) return;
    const dt = Math.min(rawDelta, 0.05);
    const time = clock.elapsedTime;
    const concept = ui.get().concept;
    const active = concept ? KINDS.indexOf(concept) : 0;
    const { n, layouts, pairs, cur, col, spikes, weights } = data;

    const kw = 1 - Math.exp(-dt * 3);
    for (let k = 0; k < 4; k++) weights[k]! += ((k === active ? 1 : 0) - weights[k]!) * kw;

    // Keep the mind beside the copy on wide screens.
    const aspect = viewport.width / viewport.height;
    g.position.x += ((aspect > 1.15 ? 2.5 : 0) - g.position.x) * kw;
    g.position.y = 28 + (aspect > 1.15 ? 0 : 1.2);

    const idle = live.reduced ? 0.2 : 1;
    const spinSpeed = [0.08, 0.03, 0.05, 0.2][active]! * idle;
    s.rotation.y += dt * spinSpeed;
    s.rotation.x += (-live.mouseS.y * 0.3 - s.rotation.x) * kw;
    s.rotation.z += (live.mouseS.x * 0.15 - s.rotation.z) * kw;

    const target = layouts[active]!;
    const km = 1 - Math.exp(-dt * (live.reduced ? 6 : 2.6));
    mixColor.setRGB(0, 0, 0);
    for (let k = 0; k < 4; k++) {
      const c = COLORS[k]!;
      mixColor.r += c.r * weights[k]!;
      mixColor.g += c.g * weights[k]!;
      mixColor.b += c.b * weights[k]!;
    }
    const waveX = ((time * 5) % 13) - 6.5;
    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      const wob = 0.04 * idle;
      cur[i3] = cur[i3]! + (target[i3]! + Math.sin(time * 0.9 + i) * wob - cur[i3]!) * km;
      cur[i3 + 1] = cur[i3 + 1]! + (target[i3 + 1]! + Math.cos(time * 0.7 + i * 1.3) * wob - cur[i3 + 1]!) * km;
      cur[i3 + 2] = cur[i3 + 2]! + (target[i3 + 2]! - cur[i3 + 2]!) * km;

      // Activation per architecture, blended by weight.
      if (Math.random() < dt * 0.7) spikes[i] = 1;
      spikes[i] = spikes[i]! * Math.exp(-dt * 7);
      const x = cur[i3]!;
      const aN = 0.35 + 0.25 * Math.sin(time * 1.2 + i * 0.37);
      const aY = 0.2 + 1.1 * Math.exp(-((x - waveX) ** 2) / 0.35);
      const aS = 0.06 + spikes[i]! * 1.4;
      const aV = 0.25 + 0.9 * Math.max(0, Math.sin(x * 1.3 - time * 2.6 + (i % 2) * 1.2));
      const a = (aN * weights[0]! + aY * weights[1]! + aS * weights[2]! + aV * weights[3]!) * (1 + live.pulse * 0.5);
      col[i3] = mixColor.r * a;
      col[i3 + 1] = mixColor.g * a;
      col[i3 + 2] = mixColor.b * a;
    }
    data.geo.getAttribute("position").needsUpdate = true;
    data.geo.getAttribute("color").needsUpdate = true;

    pairs.forEach((p, k) => {
      const ls = lineRefs.current[k];
      if (!ls) return;
      const w = weights[k]!;
      const m = ls.material as THREE.LineBasicMaterial;
      m.opacity = w * vis * (k === 2 ? 0.45 : 0.3);
      ls.visible = m.opacity > 0.01;
      if (!ls.visible) return;
      m.color.copy(COLORS[k]!);
      const arr = (data.lineGeos[k]!.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
      for (let j = 0; j < p.length; j++) {
        const src = p[j]! * 3;
        arr[j * 3] = cur[src]!;
        arr[j * 3 + 1] = cur[src + 1]!;
        arr[j * 3 + 2] = cur[src + 2]!;
      }
      data.lineGeos[k]!.getAttribute("position").needsUpdate = true;
    });

    if (pointsMat.current) {
      pointsMat.current.opacity = vis;
      pointsMat.current.size = 0.11 + weights[2]! * 0.05;
    }
    if (coreMat.current) {
      coreMat.current.opacity = vis * (0.35 + 0.1 * Math.sin(time * 1.4));
      coreMat.current.color.copy(mixColor);
    }
  });

  return (
    <group ref={group} position={[0, 28, 0]} visible={false}>
      <mesh position={[0, 0, -2]}>
        <planeGeometry args={[14, 14]} />
        <meshBasicMaterial ref={coreMat} map={data.glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </mesh>
      <group ref={spin}>
        <points geometry={data.geo}>
          <pointsMaterial
            ref={pointsMat}
            map={data.dot}
            vertexColors
            size={0.11}
            sizeAttenuation
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </points>
        {data.lineGeos.map((g, k) => (
          <lineSegments key={k} ref={(l) => { lineRefs.current[k] = l; }} geometry={g}>
            <lineBasicMaterial transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
          </lineSegments>
        ))}
      </group>
    </group>
  );
}

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { rng } from "../layouts";
import { PALETTE } from "../palette";
import { live, ui } from "../store";
import { layersAt } from "../timeline";
import { makeDotTexture } from "./textures";

const CONCEPT_COLORS = { yolo: PALETTE.cyan, spike: PALETTE.lime, vlm: PALETTE.ice } as const;

/** Dust drifting through the whole environment; reacts to cursor, hover pulses and concepts. */
export function AmbientField() {
  const pts = useRef<THREE.Points>(null);
  const mat = useRef<THREE.PointsMaterial>(null);
  const tint = useMemo(() => new THREE.Color(), []);
  const base = useMemo(() => new THREE.Color(PALETTE.ice), []);
  const lime = useMemo(() => new THREE.Color(PALETTE.lime), []);

  const { geo, tex } = useMemo(() => {
    const n = live.lowPower ? 700 : 1800;
    const r = rng(3);
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (r() - 0.5) * 30;
      arr[i * 3 + 1] = -3 + r() * 38;
      arr[i * 3 + 2] = -16 + r() * 26;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return { geo, tex: makeDotTexture() };
  }, []);

  useEffect(() => () => { geo.dispose(); tex.dispose(); }, [geo, tex]);

  useFrame(({ clock }, rawDelta) => {
    const p = pts.current;
    const m = mat.current;
    if (!p || !m) return;
    const dt = Math.min(rawDelta, 0.05);
    const idle = live.reduced ? 0 : 1;
    p.rotation.y += dt * 0.012 * idle + live.pulse * dt * 0.05;
    p.position.x = -live.mouseS.x * 0.6;
    p.position.y = -live.mouseS.y * 0.4 + Math.sin(clock.elapsedTime * 0.2) * 0.15 * idle;
    const L = layersAt(live.ts);
    const concept = ui.get().concept;
    tint.copy(base);
    if (L.neural > 0 && concept) tint.lerp(new THREE.Color(CONCEPT_COLORS[concept]), L.neural * 0.8);
    tint.lerp(lime, live.pulse * 0.6);
    m.color.copy(tint);
    m.size = 0.045 * (1 + live.pulse * 0.9 + L.neural * 0.4);
    m.opacity = 0.5 + live.pulse * 0.3;
  });

  return (
    <points ref={pts} geometry={geo}>
      <pointsMaterial
        ref={mat}
        map={tex}
        size={0.045}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color={PALETTE.ice}
        opacity={0.5}
        onBeforeCompile={(sh) => {
          // Cap sprite size so dust passing the lens never becomes a blob.
          sh.vertexShader = sh.vertexShader.replace("#include <fog_vertex>", "#include <fog_vertex>\n  gl_PointSize = min(gl_PointSize, 7.0);");
        }}
      />
    </points>
  );
}

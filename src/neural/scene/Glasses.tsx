import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "../palette";
import { live } from "../store";
import { LENS_T, layersAt, smoothstep } from "../timeline";
import { makeGlowTexture, makeReticleTexture } from "./textures";

function superellipse(a: number, b: number, n: number, seg = 96) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < seg; i++) {
    const th = (i / seg) * Math.PI * 2;
    const c = Math.cos(th);
    const s = Math.sin(th);
    pts.push(new THREE.Vector2(a * Math.sign(c) * Math.abs(c) ** (2 / n), b * Math.sign(s) * Math.abs(s) ** (2 / n)));
  }
  return pts;
}

const RIM_X = 0.86;

export function Glasses() {
  const group = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const reticleMat = useRef<THREE.MeshBasicMaterial>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.Mesh>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);

  const { rimGeo, lensGeo, bridgeGeo, reticleTex, glowTex } = useMemo(() => {
    const outer = new THREE.Shape(superellipse(0.74, 0.5, 3.4));
    outer.holes.push(new THREE.Path(superellipse(0.645, 0.405, 3.4).reverse()));
    const rimGeo = new THREE.ExtrudeGeometry(outer, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.022,
      bevelSegments: 4,
      curveSegments: 64,
    });
    rimGeo.translate(0, 0, -0.035);
    const lensGeo = new THREE.ShapeGeometry(new THREE.Shape(superellipse(0.655, 0.415, 3.4)), 48);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.14, 0.2, 0),
      new THREE.Vector3(0, 0.27, 0.03),
      new THREE.Vector3(0.14, 0.2, 0),
    ]);
    const bridgeGeo = new THREE.TubeGeometry(curve, 24, 0.032, 12, false);
    return {
      rimGeo,
      lensGeo,
      bridgeGeo,
      reticleTex: makeReticleTexture(PALETTE.cyan),
      glowTex: makeGlowTexture(),
    };
  }, []);

  useEffect(
    () => () => {
      rimGeo.dispose();
      lensGeo.dispose();
      bridgeGeo.dispose();
      reticleTex.dispose();
      glowTex.dispose();
    },
    [rimGeo, lensGeo, bridgeGeo, reticleTex, glowTex],
  );

  useFrame(({ clock }, rawDelta) => {
    const g = group.current;
    const tl = tilt.current;
    if (!g || !tl) return;
    const L = layersAt(live.ts);
    g.visible = L.glasses > 0;
    if (!g.visible) return;
    const dive = smoothstep(0.2, LENS_T, live.ts);
    const free = 1 - dive;
    const time = clock.elapsedTime;
    const idle = live.reduced ? 0 : 1;
    const dt = Math.min(rawDelta, 0.05);
    const k = 1 - Math.exp(-dt * 5);
    const ry = (live.mouseS.x * 0.42 + Math.sin(time * 0.35) * 0.06 * idle) * free;
    const rx = (-live.mouseS.y * 0.22 + Math.sin(time * 0.5) * 0.03 * idle) * free;
    tl.rotation.y += (ry - tl.rotation.y) * k;
    tl.rotation.x += (rx - tl.rotation.x) * k;
    tl.position.y = Math.sin(time * 0.8) * 0.05 * idle * free;
    if (reticleMat.current) {
      reticleMat.current.opacity = 0.18 + 0.5 * dive + Math.sin(time * 2.4) * 0.05 * idle;
    }
    if (glow.current && glowMat.current) {
      glow.current.position.x = live.mouseS.x * 0.8;
      glow.current.position.y = live.mouseS.y * 0.5;
      glowMat.current.opacity = 0.22 + live.pulse * 0.2 + Math.sin(time * 0.6) * 0.03;
    }
    if (led.current) led.current.emissiveIntensity = 2.5 + Math.sin(time * 3) * 1.2 * idle;
  });

  return (
    <group ref={group}>
      <mesh ref={glow} position={[0, 0, -2.2]} renderOrder={-1}>
        <planeGeometry args={[11, 7]} />
        <meshBasicMaterial
          ref={glowMat}
          map={glowTex}
          color={PALETTE.cyan}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.25}
          fog={false}
        />
      </mesh>
      <group ref={tilt}>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * RIM_X, 0, 0]}>
            <mesh geometry={rimGeo}>
              <meshPhysicalMaterial color={PALETTE.steel} metalness={0.92} roughness={0.22} clearcoat={1} clearcoatRoughness={0.15} />
            </mesh>
            <mesh geometry={lensGeo} position={[0, 0, 0.01]}>
              <meshPhysicalMaterial
                color="#0b1d26"
                metalness={0.2}
                roughness={0.04}
                transparent
                opacity={0.62}
                iridescence={1}
                iridescenceIOR={1.7}
                envMapIntensity={2.4}
                clearcoat={1}
                depthWrite={false}
              />
            </mesh>
          </group>
        ))}
        <mesh position={[-RIM_X, 0.02, 0.03]} scale={0.5}>
          <planeGeometry args={[2, 2]} />
          <meshBasicMaterial
            ref={reticleMat}
            map={reticleTex}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            opacity={0.25}
          />
        </mesh>
        <mesh geometry={bridgeGeo}>
          <meshPhysicalMaterial color={PALETTE.graphite} metalness={1} roughness={0.2} />
        </mesh>
        {/* Electronics brow bar */}
        <RoundedBox args={[3.38, 0.15, 0.13]} radius={0.05} smoothness={4} position={[0, 0.47, -0.01]}>
          <meshPhysicalMaterial color={PALETTE.steel} metalness={0.85} roughness={0.3} clearcoat={0.8} />
        </RoundedBox>
        {/* Camera module */}
        <group position={[1.5, 0.47, 0.07]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.04, 24]} />
            <meshPhysicalMaterial color="#05070a" metalness={0.4} roughness={0.05} clearcoat={1} />
          </mesh>
          <mesh position={[0, 0, 0.021]}>
            <torusGeometry args={[0.058, 0.008, 8, 32]} />
            <meshStandardMaterial ref={led} color={PALETTE.cyan} emissive={PALETTE.cyan} emissiveIntensity={3} toneMapped={false} />
          </mesh>
        </group>
        <mesh position={[-1.5, 0.47, 0.072]}>
          <sphereGeometry args={[0.014, 12, 12]} />
          <meshStandardMaterial color={PALETTE.lime} emissive={PALETTE.lime} emissiveIntensity={3} toneMapped={false} />
        </mesh>
        {/* Temples */}
        {[-1, 1].map((side) => (
          <group key={`t${side}`} position={[side * 1.64, 0.4, -0.06]} rotation={[0, side * 0.06, 0]}>
            <RoundedBox args={[0.09, 0.13, 2.5]} radius={0.04} smoothness={4} position={[0, 0, -1.25]}>
              <meshPhysicalMaterial color={PALETTE.steel} metalness={0.85} roughness={0.3} clearcoat={0.8} />
            </RoundedBox>
            <RoundedBox args={[0.08, 0.11, 0.7]} radius={0.035} smoothness={4} position={[0, -0.22, -2.62]} rotation={[0.6, 0, 0]}>
              <meshPhysicalMaterial color={PALETTE.graphite} metalness={0.6} roughness={0.4} />
            </RoundedBox>
            <mesh position={[side * 0.047, 0, -0.5]} rotation={[0, (side * Math.PI) / 2, 0]}>
              <planeGeometry args={[0.6, 0.012]} />
              <meshBasicMaterial color={PALETTE.cyan} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

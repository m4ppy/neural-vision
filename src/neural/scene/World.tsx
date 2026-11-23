import { Grid } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OBJECTS, RELATIONS } from "../data";
import { PALETTE } from "../palette";
import { live, ui } from "../store";
import { layersAt } from "../timeline";

export const PROXIMITY_M = 3.5;

type V3 = [number, number, number];
interface PartDef {
  geo: THREE.BufferGeometry;
  pos: V3;
  rot?: V3;
  scale?: V3;
}

function parts(id: string): PartDef[] {
  switch (id) {
    case "person":
      return [
        { geo: new THREE.CapsuleGeometry(0.27, 0.62, 6, 14), pos: [0, 1.22, 0] },
        { geo: new THREE.SphereGeometry(0.17, 20, 16), pos: [0, 1.86, 0] },
        { geo: new THREE.CapsuleGeometry(0.1, 0.72, 4, 10), pos: [-0.13, 0.46, 0] },
        { geo: new THREE.CapsuleGeometry(0.1, 0.72, 4, 10), pos: [0.13, 0.46, 0] },
        { geo: new THREE.CapsuleGeometry(0.07, 0.6, 4, 10), pos: [-0.37, 1.15, 0.02], rot: [0, 0, 0.12] },
        { geo: new THREE.CapsuleGeometry(0.07, 0.6, 4, 10), pos: [0.37, 1.15, 0.02], rot: [0, 0, -0.12] },
      ];
    case "chair": {
      const legs: PartDef[] = [
        [-0.21, -0.21],
        [0.21, -0.21],
        [-0.21, 0.21],
        [0.21, 0.21],
      ].map(([x, z]) => ({ geo: new THREE.CylinderGeometry(0.02, 0.02, 0.46, 8), pos: [x!, 0.23, z!] as V3 }));
      return [
        { geo: new THREE.BoxGeometry(0.5, 0.05, 0.5), pos: [0, 0.48, 0] },
        { geo: new THREE.BoxGeometry(0.5, 0.5, 0.04), pos: [0, 0.76, -0.23], rot: [-0.08, 0, 0] },
        ...legs,
      ];
    }
    case "laptop":
      return [
        { geo: new THREE.BoxGeometry(0.62, 0.022, 0.42), pos: [0, 0.011, 0] },
        { geo: new THREE.BoxGeometry(0.62, 0.42, 0.018), pos: [0, 0.2, -0.24], rot: [-0.24, 0, 0] },
      ];
    case "cup":
      return [
        { geo: new THREE.CylinderGeometry(0.07, 0.058, 0.16, 24, 1, true), pos: [0, 0.08, 0] },
        { geo: new THREE.TorusGeometry(0.045, 0.012, 8, 20, Math.PI * 1.3), pos: [0.075, 0.085, 0], rot: [0, 0, -Math.PI * 0.65] },
      ];
    case "plant":
      return [
        { geo: new THREE.CylinderGeometry(0.22, 0.16, 0.4, 20), pos: [0, 0.2, 0] },
        { geo: new THREE.IcosahedronGeometry(0.4, 1), pos: [0, 0.86, 0], scale: [1, 1.25, 1] },
        { geo: new THREE.IcosahedronGeometry(0.24, 1), pos: [0.22, 1.3, 0.05] },
        { geo: new THREE.IcosahedronGeometry(0.2, 1), pos: [-0.24, 1.15, -0.08] },
      ];
    default:
      return [];
  }
}

const LAYOUT: Record<string, { pos: V3; rot: number }> = {
  person: { pos: [-2.6, 0, -0.9], rot: 0.35 },
  chair: { pos: [-0.35, 0, 0.9], rot: 0.6 },
  laptop: { pos: [1.3, 0.79, -0.95], rot: -0.15 },
  cup: { pos: [2.02, 0.79, -0.72], rot: 0.4 },
  plant: { pos: [3.7, 0, 0.3], rot: 0 },
};

function relMid(a: string, b: string): V3 {
  const A = LAYOUT[a]!.pos;
  const B = LAYOUT[b]!.pos;
  return [(A[0] + B[0]) / 2, Math.max(A[1], B[1]) + 1.25, (A[2] + B[2]) / 2];
}

interface ObjRuntime {
  group: THREE.Group | null;
  line: THREE.LineBasicMaterial;
  solid: THREE.MeshStandardMaterial;
  box: THREE.Box3;
  corners: THREE.Vector3[];
  center: THREE.Vector3;
  top: THREE.Vector3;
  conf: number;
  lastMeta: string;
}

const COL = {
  cyan: new THREE.Color(PALETTE.cyan),
  lime: new THREE.Color(PALETTE.lime),
  ice: new THREE.Color(PALETTE.ice),
  signal: new THREE.Color(PALETTE.signal),
  graphite: new THREE.Color(PALETTE.graphite),
};

function Part({ def, solid, line }: { def: PartDef; solid: THREE.Material; line: THREE.Material }) {
  const edges = useMemo(() => new THREE.EdgesGeometry(def.geo, 24), [def.geo]);
  useEffect(() => () => { edges.dispose(); def.geo.dispose(); }, [edges, def.geo]);
  return (
    <group position={def.pos} rotation={def.rot ?? [0, 0, 0]} scale={def.scale ?? [1, 1, 1]}>
      <mesh geometry={def.geo} material={solid} />
      <lineSegments geometry={edges} material={line} />
    </group>
  );
}

function Furniture({ line, solid }: { line: THREE.Material; solid: THREE.Material }) {
  const desk = useMemo<PartDef[]>(
    () => [
      { geo: new THREE.BoxGeometry(2.3, 0.05, 1.05), pos: [0, 0.765, 0] },
      ...[
        [-1.08, -0.45],
        [1.08, -0.45],
        [-1.08, 0.45],
        [1.08, 0.45],
      ].map(([x, z]) => ({ geo: new THREE.BoxGeometry(0.05, 0.74, 0.05), pos: [x!, 0.37, z!] as V3 })),
    ],
    [],
  );
  const pillars = useMemo<PartDef[]>(
    () => [-7, -3.2, 3.2, 7].map((x) => ({ geo: new THREE.BoxGeometry(0.32, 7, 0.32), pos: [x, 3.5, -4.8] as V3 })),
    [],
  );
  return (
    <>
      <group position={[1.55, 0, -0.85]}>
        {desk.map((d, i) => (
          <Part key={i} def={d} solid={solid} line={line} />
        ))}
      </group>
      {pillars.map((d, i) => (
        <Part key={`p${i}`} def={d} solid={solid} line={line} />
      ))}
    </>
  );
}

export function World() {
  const root = useRef<THREE.Group>(null);
  const grid = useRef<THREE.Mesh>(null);
  const strip = useRef<THREE.MeshBasicMaterial>(null);
  const wearer = useRef<THREE.Mesh>(null);
  const wearerMat = useRef<THREE.MeshBasicMaterial>(null);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const relLine = useRef<THREE.LineSegments>(null);
  const relMat = useRef<THREE.LineBasicMaterial>(null);
  const { camera, size } = useThree();

  const furnitureMats = useMemo(
    () => ({
      line: new THREE.LineBasicMaterial({ color: PALETTE.cyan, transparent: true, opacity: 0.22 }),
      solid: new THREE.MeshStandardMaterial({ color: PALETTE.steel, metalness: 0.6, roughness: 0.45 }),
    }),
    [],
  );

  const objs = useMemo(
    () =>
      OBJECTS.map((o) => ({
        def: o,
        parts: parts(o.id),
        rt: {
          group: null,
          line: new THREE.LineBasicMaterial({ color: PALETTE.cyan, transparent: true, opacity: 0.8 }),
          solid: new THREE.MeshStandardMaterial({
            color: PALETTE.graphite,
            metalness: 0.55,
            roughness: 0.35,
            emissive: PALETTE.lime,
            emissiveIntensity: 0,
          }),
          box: new THREE.Box3(),
          corners: Array.from({ length: 8 }, () => new THREE.Vector3()),
          center: new THREE.Vector3(),
          top: new THREE.Vector3(),
          conf: o.confidence,
          lastMeta: "",
        } as ObjRuntime,
      })),
    [],
  );

  const relGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(RELATIONS.length * 6), 3));
    return g;
  }, []);

  useEffect(
    () => () => {
      furnitureMats.line.dispose();
      furnitureMats.solid.dispose();
      objs.forEach((o) => { o.rt.line.dispose(); o.rt.solid.dispose(); });
      relGeo.dispose();
    },
    [furnitureMats, objs, relGeo],
  );

  const v = useMemo(() => new THREE.Vector3(), []);
  const camFloor = useMemo(() => new THREE.Vector3(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const frame = useRef(0);

  useFrame(({ clock }) => {
    const r = root.current;
    if (!r) return;
    const L = layersAt(live.ts);
    r.visible = L.world > 0;
    const { hovered, mode } = ui.get();
    const ov = Math.max(L.perceptionOverlay, L.beyond * (mode < 2 ? 1 : 0));
    const els = live.els;
    if (els.overlay) {
      els.overlay.style.opacity = r.visible ? ov.toFixed(3) : "0";
      els.overlay.dataset["active"] = ov > 0.6 && r.visible ? "true" : "false";
    }
    if (!r.visible) return;
    frame.current++;
    const time = clock.elapsedTime;
    const obstacle = L.beyond * (mode === 1 ? 1 : 0);
    const sceneW = L.beyond * (mode === 2 ? 1 : 0);
    camFloor.set(camera.position.x, 0, camera.position.z);

    // Grid reacts to focus anywhere in the scene.
    const gm = grid.current?.material as THREE.ShaderMaterial | undefined;
    const sc = gm?.uniforms["sectionColor"]?.value as THREE.Color | undefined;
    if (sc) {
      tmpColor.copy(COL.cyan).lerp(COL.lime, live.pulse * 0.8);
      if (obstacle > 0.01) tmpColor.lerp(COL.lime, obstacle * 0.5);
      sc.copy(tmpColor);
    }
    if (strip.current) strip.current.opacity = 0.35 + 0.15 * Math.sin(time * 1.5) + live.pulse * 0.4;

    let nearestId = "";
    let nearestD = Infinity;
    const w = size.width;
    const h = size.height;

    objs.forEach(({ def, rt }, i) => {
      const g = rt.group;
      if (!g) return;
      if (rt.box.isEmpty()) {
        g.updateWorldMatrix(true, true);
        rt.box.setFromObject(g);
        const { min, max } = rt.box;
        let c = 0;
        for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) rt.corners[c++]!.set(x, y, z);
        rt.box.getCenter(rt.center);
        rt.top.set(rt.center.x, max.y + 0.1, rt.center.z);
      }
      // Distance from wearer (on the floor) to nearest point of the object footprint.
      const dx = Math.max(rt.box.min.x - camFloor.x, 0, camFloor.x - rt.box.max.x);
      const dz = Math.max(rt.box.min.z - camFloor.z, 0, camFloor.z - rt.box.max.z);
      const dist = Math.hypot(dx, dz);
      live.distances[def.id] = dist;
      if (dist < nearestD) { nearestD = dist; nearestId = def.label; }
      const near = obstacle > 0.5 && dist < PROXIMITY_M;

      // 3D highlight.
      const isHot = hovered === def.id;
      const dim = hovered !== null && !isHot;
      const target = near ? COL.signal : isHot ? COL.lime : sceneW > 0.5 ? COL.ice : COL.cyan;
      rt.line.color.lerp(target, 0.15);
      rt.line.opacity += ((dim ? 0.22 : isHot ? 1 : 0.75 + L.finale * 0.25) - rt.line.opacity) * 0.15;
      rt.solid.emissiveIntensity += ((isHot ? 0.22 : 0) - rt.solid.emissiveIntensity) * 0.12;
      const s = 1 + (isHot ? 0.03 : 0);
      g.scale.setScalar(g.scale.x + (s - g.scale.x) * 0.15);

      const ring = ringRefs.current[i];
      if (ring) {
        const m = ring.material as THREE.MeshBasicMaterial;
        m.opacity = obstacle * (near ? 0.85 : 0.35) * (0.8 + 0.2 * Math.sin(time * 4 + i));
        m.color.copy(near ? COL.signal : COL.lime);
        ring.visible = m.opacity > 0.01;
      }

      // Project the box to screen for the DOM overlay.
      const box = els.boxes[def.id];
      if (!box || ov < 0.01) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let behind = false;
      for (const c of rt.corners) {
        v.copy(c).project(camera);
        if (v.z > 1) behind = true;
        minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y);
      }
      if (behind) { box.root.style.visibility = "hidden"; return; }
      const x = (minX * 0.5 + 0.5) * w;
      const y = (1 - (maxY * 0.5 + 0.5)) * h;
      const bw = (maxX - minX) * 0.5 * w;
      const bh = (maxY - minY) * 0.5 * h;
      box.root.style.visibility = "visible";
      box.root.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      box.root.style.width = `${bw.toFixed(1)}px`;
      box.root.style.height = `${bh.toFixed(1)}px`;
      box.root.dataset["near"] = near ? "true" : "false";

      if (frame.current % 30 === i) rt.conf = Math.min(0.99, def.confidence + (Math.random() - 0.5) * 0.02);
      const meta = obstacle > 0.5 ? `${dist.toFixed(1)} m` : rt.conf.toFixed(2);
      if (box.meta && meta !== rt.lastMeta) { box.meta.textContent = meta; rt.lastMeta = meta; }

      const line = els.lineEls[def.id];
      if (line) {
        const cx = x + bw / 2;
        const cy = y + bh / 2;
        const hotObj = hovered ? objs.find((o) => o.def.id === hovered) : undefined;
        let tx = w / 2;
        let ty = h * 0.5;
        if (hotObj && hovered !== def.id) {
          v.copy(hotObj.rt.center).project(camera);
          tx = (v.x * 0.5 + 0.5) * w;
          ty = (1 - (v.y * 0.5 + 0.5)) * h;
        }
        line.setAttribute("x1", cx.toFixed(1));
        line.setAttribute("y1", cy.toFixed(1));
        line.setAttribute("x2", tx.toFixed(1));
        line.setAttribute("y2", ty.toFixed(1));
        line.style.opacity = hovered === def.id ? "0" : hovered ? "0.75" : "0.14";
      }
    });

    if (els.nearest && obstacle > 0.01) {
      const txt = `${nearestId.toUpperCase()} · ${nearestD.toFixed(1)} m`;
      if (els.nearest.textContent !== txt) els.nearest.textContent = txt;
    }

    // Wearer awareness ring.
    if (wearer.current && wearerMat.current) {
      wearer.current.position.set(camFloor.x, 0.01, camFloor.z);
      wearerMat.current.opacity = obstacle * 0.55;
      wearer.current.visible = obstacle > 0.01;
    }

    // Scene-understanding relation graph.
    if (relLine.current && relMat.current) {
      relMat.current.opacity = sceneW * 0.85;
      relLine.current.visible = sceneW > 0.01;
      if (sceneW > 0.01) {
        const arr = (relGeo.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
        RELATIONS.forEach(([a, b], k) => {
          const A = objs.find((o) => o.def.id === a)?.rt.top;
          const B = objs.find((o) => o.def.id === b)?.rt.top;
          if (!A || !B) return;
          arr.set([A.x, A.y, A.z, B.x, B.y, B.z], k * 6);
        });
        relGeo.getAttribute("position").needsUpdate = true;
      }
      RELATIONS.forEach(([a, b], k) => {
        const el = els.relEls[k];
        if (!el) return;
        el.style.opacity = sceneW.toFixed(3);
        if (sceneW < 0.01) return;
        const m = relMid(a, b);
        v.set(m[0], m[1], m[2]).project(camera);
        el.style.transform = `translate3d(${((v.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((1 - (v.y * 0.5 + 0.5)) * h).toFixed(1)}px, 0) translate(-50%, -50%)`;
      });
    }
  });

  return (
    <group ref={root} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={PALETTE.voidLift} metalness={0.5} roughness={0.55} />
      </mesh>
      <Grid
        ref={grid}
        position={[0, 0.001, 0]}
        args={[60, 60]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor={PALETTE.graphite}
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor={PALETTE.cyan}
        fadeDistance={26}
        fadeStrength={1.6}
        infiniteGrid
      />
      {/* Light strip behind the space */}
      <mesh position={[0, 4.2, -4.95]}>
        <planeGeometry args={[18, 0.04]} />
        <meshBasicMaterial ref={strip} color={PALETTE.cyan} transparent opacity={0.4} toneMapped={false} />
      </mesh>
      <Furniture line={furnitureMats.line} solid={furnitureMats.solid} />
      {objs.map(({ def, parts: ps, rt }, i) => {
        const lay = LAYOUT[def.id]!;
        return (
          <group key={def.id}>
            <group
              ref={(g) => { rt.group = g; }}
              position={lay.pos}
              rotation={[0, lay.rot, 0]}
            >
              {ps.map((p, k) => (
                <Part key={k} def={p} solid={rt.solid} line={rt.line} />
              ))}
              {def.id === "laptop" && (
                <mesh position={[0, 0.2, -0.229]} rotation={[-0.24, 0, 0]}>
                  <planeGeometry args={[0.56, 0.36]} />
                  <meshBasicMaterial color={PALETTE.cyan} transparent opacity={0.55} toneMapped={false} />
                </mesh>
              )}
            </group>
            <mesh
              ref={(m) => { ringRefs.current[i] = m; }}
              position={[lay.pos[0], 0.012, lay.pos[2]]}
              rotation={[-Math.PI / 2, 0, 0]}
              visible={false}
            >
              <ringGeometry args={[0.55, 0.6, 48]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      <mesh ref={wearer} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[PROXIMITY_M - 0.02, PROXIMITY_M, 96]} />
        <meshBasicMaterial ref={wearerMat} color={PALETTE.lime} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <lineSegments ref={relLine} geometry={relGeo} visible={false}>
        <lineBasicMaterial ref={relMat} color={PALETTE.ice} transparent opacity={0} />
      </lineSegments>
    </group>
  );
}

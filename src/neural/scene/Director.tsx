import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { LENS_T, MAX_T, cameraAt, layersAt, sectionAt, smoothstep } from "../timeline";
import { live, ui } from "../store";

const look = new THREE.Vector3();
const lookTarget = new THREE.Vector3();
const posTarget = new THREE.Vector3();

/** The one stepper: smooths scroll and cursor, flies the camera, syncs the DOM layers. */
export function Director() {
  const { camera, scene, size } = useThree();
  const frames = useRef(0);
  const lastSide = useRef(0);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const k = live.reduced ? 1 : 1 - Math.exp(-dt * 6);
    live.ts += (live.t - live.ts) * k;
    const km = live.reduced ? 0 : 1 - Math.exp(-dt * 4);
    live.mouseS.x += (live.mouse.x - live.mouseS.x) * km;
    live.mouseS.y += (live.mouse.y - live.mouseS.y) * km;
    live.pulse *= Math.exp(-dt * 2.2);

    const t = live.ts;
    const cam = cameraAt(t);
    const par = live.reduced ? 0 : 1;
    lookTarget.set(cam.look[0], cam.look[1], cam.look[2]);
    // Portrait screens: pull the camera back along its view line (but still land inside the lens).
    const aspect = size.width / Math.max(size.height, 1);
    let fit = aspect < 1 ? Math.min(2.1, (1 / aspect) ** 0.75) : 1;
    if (t < LENS_T) fit = fit + (1 - fit) * smoothstep(0.5, LENS_T, t);
    posTarget.set(cam.pos[0], cam.pos[1], cam.pos[2]).sub(lookTarget).multiplyScalar(fit).add(lookTarget);
    posTarget.x += live.mouseS.x * 0.35 * par;
    posTarget.y += live.mouseS.y * 0.2 * par;

    // Hard cut through the lens: snap instead of gliding.
    const side = t < LENS_T + 0.005 ? 0 : 1;
    if (side !== lastSide.current || frames.current === 0) {
      camera.position.copy(posTarget);
      look.copy(lookTarget);
      lastSide.current = side;
    } else {
      const kc = 1 - Math.exp(-dt * 8);
      camera.position.lerp(posTarget, kc);
      look.lerp(lookTarget, kc);
    }
    camera.lookAt(look);

    const L = layersAt(t);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.far = 34 + L.finale * 20;
    }

    const { hero, flash, progress } = live.els;
    if (hero) {
      hero.style.opacity = String(L.hero);
      hero.style.transform = `translate3d(0, ${(-t * 8).toFixed(2)}vh, 0) scale(${(1 + (1 - L.hero) * 0.08).toFixed(4)})`;
    }
    if (flash) flash.style.opacity = live.reduced ? "0" : String(L.flash);
    if (progress) progress.style.transform = `scaleX(${Math.min(1, live.t / MAX_T).toFixed(4)})`;

    const chapter = sectionAt(live.t);
    if (ui.get().chapter !== chapter) ui.set({ chapter });

    frames.current++;
    if (frames.current === 3) {
      live.ready = true;
      document.querySelector("[data-scene-root]")?.setAttribute("data-scene-ready", "true");
    }
  });

  return null;
}

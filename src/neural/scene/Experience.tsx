import { Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { PALETTE } from "../palette";
import { live } from "../store";
import { AmbientField } from "./AmbientField";
import { Director } from "./Director";
import { Glasses } from "./Glasses";
import { NeuralNet } from "./NeuralNet";
import { World } from "./World";

export default function Experience() {
  return (
    <Canvas
      dpr={live.lowPower ? 1 : [1, 1.75]}
      camera={{ fov: 40, near: 0.05, far: 140, position: [0, 0, 6.4] }}
      gl={{ antialias: !live.lowPower, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={[PALETTE.void]} />
      <fog attach="fog" args={[PALETTE.void, 9, 34]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={[PALETTE.ice, PALETTE.void, 0.45]} />
      <directionalLight position={[4, 6, 5]} intensity={1.3} color={PALETTE.ice} />
      <pointLight position={[-3, 1, -2]} intensity={14} distance={12} color={PALETTE.cyan} />
      <pointLight position={[3, -1, 2]} intensity={4} distance={10} color={PALETTE.lime} />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2.2} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer intensity={2.5} color={PALETTE.cyan} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 0.6, 1]} />
        <Lightformer intensity={1.4} color={PALETTE.ice} position={[5, 0.5, 2]} rotation-y={-Math.PI / 2} scale={[20, 1.2, 1]} />
        <Lightformer intensity={0.8} color={PALETTE.lime} position={[0, -3, 4]} scale={[8, 0.3, 1]} />
      </Environment>
      <Director />
      <AmbientField />
      <Glasses />
      <World />
      <NeuralNet />
    </Canvas>
  );
}

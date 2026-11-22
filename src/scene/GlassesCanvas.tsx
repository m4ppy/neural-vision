import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox } from '@react-three/drei'
import {
  CanvasTexture, ExtrudeGeometry, Group, MathUtils, Path, Shape, SRGBColorSpace, TubeGeometry,
  CatmullRomCurve3, Vector3,
} from 'three'
import { ContextGuard, RenderBoundary } from './RenderBoundary'

export type OpticalMotion = { x: number; y: number; scroll: number }

type CanvasProps = {
  motion: RefObject<OpticalMotion>
  visible: boolean
  onReady: () => void
  onFailure: () => void
}

function contour(path: Path, scale = 1) {
  const centerX = 1.73
  const point = (x: number, y: number) => [centerX + (x - centerX) * scale, y * scale] as const

  path.moveTo(...point(0.49, 0.77))
  path.quadraticCurveTo(...point(1.45, 0.88), ...point(2.78, 0.76))
  path.quadraticCurveTo(...point(3.17, 0.72), ...point(3.15, 0.36))
  path.lineTo(...point(2.99, -0.46))
  path.quadraticCurveTo(...point(2.92, -0.79), ...point(2.55, -0.87))
  path.quadraticCurveTo(...point(1.57, -1.02), ...point(0.91, -0.76))
  path.quadraticCurveTo(...point(0.56, -0.62), ...point(0.45, -0.26))
  path.lineTo(...point(0.29, 0.39))
  path.quadraticCurveTo(...point(0.20, 0.72), ...point(0.49, 0.77))
  path.closePath()
  return path
}

function makeGeometry() {
  const frame = new Shape()
  const opening = new Path()
  contour(frame)
  contour(opening, 0.87)
  frame.holes.push(opening)

  const lens = new Shape()
  contour(lens, 0.885)

  const bridge = new Shape()
  bridge.moveTo(-0.46, 0.61)
  bridge.quadraticCurveTo(0, 0.83, 0.46, 0.61)
  bridge.lineTo(0.42, 0.40)
  bridge.quadraticCurveTo(0, 0.67, -0.42, 0.40)
  bridge.closePath()

  const brow = new Shape()
  brow.moveTo(0.40, 0.73)
  brow.quadraticCurveTo(1.53, 0.87, 2.78, 0.74)
  brow.quadraticCurveTo(3.05, 0.73, 3.17, 0.58)
  brow.lineTo(3.11, 0.43)
  brow.quadraticCurveTo(3.03, 0.57, 2.77, 0.59)
  brow.quadraticCurveTo(1.45, 0.71, 0.39, 0.61)
  brow.closePath()

  const gasket = new Shape()
  const glassOpening = new Path()
  contour(gasket, 0.902)
  contour(glassOpening, 0.862)
  gasket.holes.push(glassOpening)

  const templePath = new CatmullRomCurve3([
    new Vector3(2.98, 0.49, -0.12), new Vector3(3.19, 0.49, -0.7),
    new Vector3(3.15, 0.46, -1.48), new Vector3(3.05, 0.37, -2.55),
    new Vector3(2.94, 0.27, -3.25), new Vector3(2.83, -0.04, -3.91),
  ])
  const temple = new TubeGeometry(templePath, 40, 0.11, 8)
  const positions = temple.attributes.position
  const center = new Vector3()
  for (let i = 0; i <= 40; i++) {
    templePath.getPointAt(i / 40, center)
    for (let j = 0; j <= 8; j++) {
      const index = i * 9 + j
      positions.setY(index, center.y + (positions.getY(index) - center.y) * 1.42)
    }
  }
  temple.computeVertexNormals()

  return {
    rim: new ExtrudeGeometry(frame, { depth: 0.21, bevelThickness: 0.058, bevelSize: 0.050, bevelSegments: 4, curveSegments: 26 }),
    inlay: new ExtrudeGeometry(frame, { depth: 0.012, bevelThickness: 0.011, bevelSize: 0.012, bevelSegments: 2, curveSegments: 24 }),
    lens: new ExtrudeGeometry(lens, { depth: 0.065, bevelThickness: 0.030, bevelSize: 0.025, bevelSegments: 3, curveSegments: 26 }),
    bridge: new ExtrudeGeometry(bridge, { depth: 0.19, bevelThickness: 0.044, bevelSize: 0.040, bevelSegments: 4 }),
    brow: new ExtrudeGeometry(brow, { depth: 0.14, bevelThickness: 0.032, bevelSize: 0.035, bevelSegments: 3, curveSegments: 20 }),
    gasket: new ExtrudeGeometry(gasket, { depth: 0.011, bevelThickness: 0.006, bevelSize: 0.009, bevelSegments: 2, curveSegments: 24 }),
    temple,
  }
}

function createLensTexture(violet: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const tint = ctx.createLinearGradient(10, 240, 185, 12)
  tint.addColorStop(0, violet ? '#111b35' : '#0b2330')
  tint.addColorStop(0.42, violet ? '#202540' : '#124153')
  tint.addColorStop(0.68, violet ? '#605b93' : '#4a8a9f')
  tint.addColorStop(0.76, violet ? '#424167' : '#295c73')
  tint.addColorStop(1, '#101820')
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, 256, 256)
  ctx.save()
  ctx.translate(125, 125)
  ctx.rotate(-0.48)
  const reflection = ctx.createLinearGradient(0, -86, 0, 34)
  reflection.addColorStop(0, 'transparent')
  reflection.addColorStop(0.59, violet ? 'rgba(184,166,255,.25)' : 'rgba(167,237,255,.32)')
  reflection.addColorStop(0.61, violet ? 'rgba(184,166,255,.10)' : 'rgba(167,237,255,.09)')
  reflection.addColorStop(1, 'transparent')
  ctx.fillStyle = reflection
  ctx.fillRect(-200, -86, 400, 120)
  ctx.restore()

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function mapLensUv(geometry: ExtrudeGeometry) {
  const positions = geometry.getAttribute('position')
  const uv = geometry.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (positions.getX(i) - 0.20) / 3, (positions.getY(i) + 0.91) / 1.83)
  }
}

function Glasses({ motion, onReady }: Pick<CanvasProps, 'motion' | 'onReady'>) {
  const product = useRef<Group>(null)
  const ready = useRef(false)
  const resources = useMemo(() => {
    const parts = makeGeometry()
    mapLensUv(parts.lens)
    return { parts, lenses: [createLensTexture(false), createLensTexture(true)] }
  }, [])
  const { parts, lenses } = resources

  useEffect(() => () => {
    Object.values(parts).forEach((part) => part.dispose())
    lenses.forEach((texture) => texture.dispose())
  }, [parts, lenses])

  useFrame(({ clock, camera }, delta) => {
    if (!product.current) return
    const t = clock.elapsedTime
    const input = motion.current
    const dt = Math.min(delta, 0.05)
    const model = product.current
    model.rotation.x = MathUtils.damp(model.rotation.x, 0.42 - input.y * 0.17 + input.scroll * 0.19, 4, dt)
    model.rotation.y = MathUtils.damp(model.rotation.y, -0.34 + input.x * 0.25 + input.scroll * 0.45, 4, dt)
    model.rotation.z = MathUtils.damp(model.rotation.z, -0.145 + input.x * 0.05, 4, dt)
    model.position.y = MathUtils.damp(model.position.y, -0.07 + Math.sin(t * 1.25) * 0.105 - input.scroll * 0.45, 3, dt)
    model.position.x = MathUtils.damp(model.position.x, -0.24 + input.x * 0.13, 3, dt)
    camera.position.z = MathUtils.damp(camera.position.z, 10.95 - input.scroll * 0.65, 4, dt)
    if (!ready.current) {
      ready.current = true
      onReady()
    }
  })

  return (
    <group ref={product} position={[-0.24, -0.07, 0]} rotation={[0.42, -0.34, -0.145]}>
      <mesh geometry={parts.bridge} position-z={0.025}>
        <meshStandardMaterial color="#343d44" metalness={0.87} roughness={0.29} />
      </mesh>
      {[-1, 1].map((side, index) => (
        <group key={side} scale-x={side}>
          <mesh geometry={parts.rim}>
            <meshStandardMaterial color="#4d5b65" metalness={0.85} roughness={0.26} />
          </mesh>
          <mesh geometry={parts.inlay} position-z={0.262} scale={[0.994, 0.991, 1]}>
            <meshStandardMaterial color="#65717b" metalness={0.92} roughness={0.24} />
          </mesh>
          <mesh geometry={parts.brow} position-z={0.162}>
            <meshStandardMaterial color="#51616c" metalness={0.82} roughness={0.28} />
          </mesh>
          <mesh geometry={parts.gasket} position-z={0.222}>
            <meshStandardMaterial color={index === 0 ? '#4e9eae' : '#747ab6'} emissive={index === 0 ? '#1d6271' : '#302e64'} emissiveIntensity={0.35} metalness={0.77} roughness={0.26} />
          </mesh>
          <mesh geometry={parts.lens} position-z={0.144}>
            <meshPhysicalMaterial map={lenses[index]} metalness={0.38} roughness={0.19} clearcoat={0.8} clearcoatRoughness={0.23} envMapIntensity={0.77} />
          </mesh>
          <mesh geometry={parts.temple}>
            <meshStandardMaterial color="#455563" metalness={0.79} roughness={0.32} />
          </mesh>
          <RoundedBox args={[0.15, 0.31, 0.12]} radius={0.045} smoothness={3} position={[0.48, -0.25, -0.13]} rotation-z={0.26}>
            <meshStandardMaterial color="#495962" metalness={0.36} roughness={0.48} />
          </RoundedBox>
          <RoundedBox args={[0.47, 0.33, 0.63]} radius={0.058} smoothness={3} position={[2.96, 0.53, 0.012]} rotation={[0, 0.03, -0.14]}>
            <meshStandardMaterial color="#3a4c59" metalness={0.83} roughness={0.33} />
          </RoundedBox>
          <mesh position={[2.99, 0.54, 0.333]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.113, 0.120, 0.038, 24]} />
            <meshStandardMaterial color="#97a5ae" metalness={0.92} roughness={0.27} />
          </mesh>
          <mesh position={[2.99, 0.54, 0.358]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.071, 0.073, 0.033, 24]} />
            <meshPhysicalMaterial color="#0a2430" emissive="#07526c" emissiveIntensity={0.29} metalness={0.55} roughness={0.19} clearcoat={1} />
          </mesh>
          <mesh position={[2.986, 0.549, 0.379]}>
            <sphereGeometry args={[0.020, 12, 8]} />
            <meshBasicMaterial color="#a9f3ff" />
          </mesh>
          <RoundedBox args={[0.235, 0.025, 0.020]} radius={0.009} smoothness={2} position={[2.61, 0.703, 0.34]} rotation-z={-0.078}>
            <meshBasicMaterial color={index === 0 ? '#54e4f7' : '#acb0ff'} />
          </RoundedBox>
          <RoundedBox args={[0.105, 0.011, 0.013]} radius={0.004} smoothness={2} position={[2.40, 0.717, 0.34]} rotation-z={-0.073}>
            <meshStandardMaterial color="#a5bbc6" metalness={0.66} roughness={0.29} />
          </RoundedBox>
          {[-0.72, -0.83, -0.94].map((z) => (
            <RoundedBox key={z} args={[0.013, 0.039, 0.038]} radius={0.005} smoothness={2} position={[3.3, 0.44, z]}>
              <meshStandardMaterial color="#6c8391" metalness={0.85} roughness={0.36} />
            </RoundedBox>
          ))}
        </group>
      ))}
    </group>
  )
}

export default function GlassesCanvas({ motion, visible, onReady, onFailure }: CanvasProps) {
  return (
    <RenderBoundary onFailure={onFailure}>
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 10.95], fov: 40 }}
        fallback={null}
        frameloop={visible ? 'always' : 'never'}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true }}
      >
        <ContextGuard onFailure={onFailure} />
        <ambientLight intensity={0.32} />
        <directionalLight position={[-2, 5, 6]} color="#d6f3ff" intensity={2.4} />
        <directionalLight position={[2, -2, 3]} color="#447b9d" intensity={0.7} />
        <Environment resolution={128}>
          <Lightformer position={[0, 4, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 3, 1]} intensity={3.8} color="#e8f6ff" />
          <Lightformer position={[-5, 1, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[5, 4, 1]} intensity={3} color="#81eaff" />
          <Lightformer position={[5, 0, -1]} rotation={[0, Math.PI / 2, 0]} scale={[4, 6, 1]} intensity={3.4} color="#8d92f0" />
          <Lightformer position={[0, 1, 7]} rotation={[0, Math.PI, 0]} scale={[9, 3, 1]} intensity={1.3} color="#b9dce9" />
          <Lightformer position={[0, -3, 3]} rotation={[-Math.PI / 4, 0, 0]} scale={[9, 0.40, 1]} intensity={2.0} color="#cbe1f4" />
        </Environment>
        <Glasses motion={motion} onReady={onReady} />
      </Canvas>
    </RenderBoundary>
  )
}

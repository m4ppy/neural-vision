import { useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { BufferGeometry, Color, DynamicDrawUsage, Group, MathUtils, ShaderMaterial } from 'three'
import type { Technology } from '../technologies'
import { ContextGuard, RenderBoundary } from './RenderBoundary'
import { maxEdges, networkEdges, networkPositions, particleCount, particleSizes } from './networkGeometry'
import type { OpticalMotion } from './GlassesCanvas'

type NetworkProps = {
  technology: Technology
  motion: RefObject<OpticalMotion>
  visible: boolean
  onReady: () => void
  onFailure: () => void
}

const vertexShader = `
  attribute float aSize;
  uniform float uDpr;
  uniform float uTime;
  uniform float uMode;
  varying float vStrength;
  void main() {
    vec4 world = modelViewMatrix * vec4(position, 1.);
    float pulse = sin(position.y * 5.5 - uTime * (1.8 + uMode * 2.8) + position.z * 2.);
    vStrength = clamp(.48 + .12 * position.z + .084 * aSize + .17 * pulse, .22, 1.);
    gl_PointSize = aSize * uDpr * (8.5 / -world.z) * (1.33 + max(0., pulse) * uMode * .36);
    gl_Position = projectionMatrix * world;
  }
`

const fragmentShader = `
  uniform vec3 uColor;
  varying float vStrength;
  void main() {
    float d = length(gl_PointCoord - .5);
    float halo = 1. - smoothstep(.06, .5, d);
    float core = 1. - smoothstep(.04, .22, d);
    gl_FragColor = vec4(mix(uColor, vec3(.91, .98, 1.), core * .7), (halo * .60 + core * .40) * vStrength);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function Network({ technology, motion, onReady }: Omit<NetworkProps, 'visible' | 'onFailure'>) {
  const orbit = useRef<Group>(null)
  const ready = useRef(false)
  const material = useRef<ShaderMaterial>(null)
  const lastTech = useRef(technology.id)
  const blend = useRef(1)
  const tint = useMemo(() => new Color(technology.color), [technology.color])
  const data = useMemo(() => ({
    vertices: new Float32Array(networkPositions.yolo.flat()),
    edges: new Float32Array(maxEdges * 6),
    colors: new Float32Array(maxEdges * 6),
    uniforms: {
      uColor: { value: new Color('#54e4f7') },
      uTime: { value: 0 },
      uMode: { value: 0 },
      uDpr: { value: 1 },
    },
  }), [])
  const points = useRef<BufferGeometry>(null)
  const paths = useRef<BufferGeometry>(null)

  useFrame(({ clock, camera, gl }, delta) => {
    if (!orbit.current || !material.current || !points.current || !paths.current) return
    const { x, y, scroll } = motion.current
    const dt = Math.min(delta, 0.05)
    const time = clock.elapsedTime
    const group = orbit.current
    group.rotation.y += dt * 0.14
    group.rotation.x = MathUtils.damp(group.rotation.x, -0.18 - y * 0.32 + scroll * 0.22, 3, dt)
    group.rotation.z = MathUtils.damp(group.rotation.z, 0.10 + x * 0.17, 3, dt)
    camera.position.x = MathUtils.damp(camera.position.x, x * 0.45, 3, dt)
    camera.position.z = MathUtils.damp(camera.position.z, 8.7 - scroll * 0.65, 3, dt)
    camera.lookAt(0, 0, 0)

    const uniforms = material.current.uniforms as typeof data.uniforms
    uniforms.uTime.value = time
    uniforms.uDpr.value = gl.getPixelRatio()
    uniforms.uColor.value.lerp(tint, 1 - Math.exp(-dt * 3.4))
    const mode = technology.id === 'spikeyolo' ? 1 : technology.id === 'vlm' ? 0.34 : 0
    uniforms.uMode.value = MathUtils.damp(uniforms.uMode.value, mode, 3, dt)

    if (lastTech.current !== technology.id) {
      lastTech.current = technology.id
      blend.current = 0
    }
    blend.current = MathUtils.damp(blend.current, 1, 3.1, dt)
    const destination = networkPositions[technology.id]
    const edges = networkEdges[technology.id]
    const positionMix = 1 - Math.exp(-dt * 4.2)
    for (let i = 0; i < particleCount; i++) {
      const offset = i * 3
      for (let axis = 0; axis < 3; axis++) {
        data.vertices[offset + axis] = MathUtils.lerp(data.vertices[offset + axis], destination[i][axis], positionMix)
      }
    }

    const color = uniforms.uColor.value
    edges.forEach(([a, b], i) => {
      const offset = i * 6
      const aStart = a * 3
      const bStart = b * 3
      for (let axis = 0; axis < 3; axis++) {
        data.edges[offset + axis] = data.vertices[aStart + axis]
        data.edges[offset + axis + 3] = data.vertices[bStart + axis]
      }
      const wave = Math.sin(i * 1.25 + time * (1.2 + mode * 3))
      const bright = (i % (mode > 0.7 ? 5 : 11) === 0 ? 0.65 : 0.13) * (0.85 + wave * 0.32) * blend.current
      for (let vertex = 0; vertex < 6; vertex += 3) {
        data.colors[offset + vertex] = color.r * bright
        data.colors[offset + vertex + 1] = color.g * bright
        data.colors[offset + vertex + 2] = color.b * bright
      }
    })

    points.current.getAttribute('position').needsUpdate = true
    paths.current.getAttribute('position').needsUpdate = true
    paths.current.getAttribute('color').needsUpdate = true
    paths.current.setDrawRange(0, edges.length * 2)
    if (!ready.current) {
      ready.current = true
      onReady()
    }
  })

  return (
    <group ref={orbit} rotation={[-0.17, 0.24, 0.10]}>
      <points frustumCulled={false}>
        <bufferGeometry ref={points}>
          <bufferAttribute attach="attributes-position" args={[data.vertices, 3]} usage={DynamicDrawUsage} />
          <bufferAttribute attach="attributes-aSize" args={[particleSizes, 1]} />
        </bufferGeometry>
        <shaderMaterial ref={material} uniforms={data.uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} />
      </points>
      <lineSegments frustumCulled={false}>
        <bufferGeometry ref={paths}>
          <bufferAttribute attach="attributes-position" args={[data.edges, 3]} usage={DynamicDrawUsage} />
          <bufferAttribute attach="attributes-color" args={[data.colors, 3]} usage={DynamicDrawUsage} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.73} depthWrite={false} />
      </lineSegments>
    </group>
  )
}

export default function NetworkCanvas({ technology, motion, visible, onReady, onFailure }: NetworkProps) {
  return (
    <RenderBoundary onFailure={onFailure}>
      <Canvas
        dpr={[1, 1.65]}
        camera={{ position: [0, 0, 8.7], fov: 44 }}
        fallback={null}
        frameloop={visible ? 'always' : 'never'}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true }}
      >
        <ContextGuard onFailure={onFailure} />
        <Network technology={technology} motion={motion} onReady={onReady} />
      </Canvas>
    </RenderBoundary>
  )
}

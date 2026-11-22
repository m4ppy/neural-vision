import { ScanEye } from 'lucide-react'

export const scenes = [
  { id: 'awaken', name: 'Awaken', number: '01' },
  { id: 'perception', name: 'Perception', number: '02' },
  { id: 'intelligence', name: 'Intelligence', number: '03' },
] as const

export type SceneId = (typeof scenes)[number]['id']

export function Wordmark() {
  return (
    <a href="#awaken" className="wordmark" aria-label="Neural Vision home">
      <ScanEye aria-hidden="true" strokeWidth={1.6} size={25} />
      <span>NEURAL<span className="wordmark-gap">VISION</span></span>
    </a>
  )
}

export function Header({ active }: { active: SceneId }) {
  return (
    <header className="site-header">
      <div className="header-inner shell">
        <Wordmark />
        <nav className="scene-nav" aria-label="Exhibition scenes">
          {scenes.map((scene) => (
            <a key={scene.id} href={`#${scene.id}`} aria-current={active === scene.id ? 'location' : undefined}>
              <span>{scene.number}</span> {scene.name}
            </a>
          ))}
        </nav>
        <div className="system-state"><i /> <span>System online</span></div>
      </div>
      <div className="site-progress" aria-hidden="true" />
    </header>
  )
}

export function SceneLabel({ number, children }: { number: string; children: string }) {
  return <p className="scene-label"><span /> Scene {number} <b>/</b> {children}</p>
}

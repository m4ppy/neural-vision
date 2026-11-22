import { ArrowUpRight, Crosshair, Radio } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type RefObject } from 'react'
import { technologies, type Technology } from '../technologies'
import type { OpticalMotion } from '../scene/GlassesCanvas'
import { networkEdges, networkPositions, particleSizes } from '../scene/networkGeometry'
import { useStage } from '../scene/useStage'
import { SceneLabel } from './ExhibitionUI'

const NetworkCanvas = lazy(() => import('../scene/NetworkCanvas'))

function NetworkPlate({ technology }: { technology: Technology }) {
  const { vertices, edges, highlight } = useMemo(() => {
    const points = networkPositions[technology.id].map(([x, y, z]) => {
      const perspective = 68 / (1 - z * 0.055)
      return [Math.round(250 + (x + z * 0.18) * perspective), Math.round(200 - (y - z * 0.15) * perspective)]
    })
    const segments = networkEdges[technology.id].map(([a, b]) => `M${points[a].join(' ')}L${points[b].join(' ')}`)
    return {
      vertices: points.filter((_, i) => i < 144 || i % 4 === 0),
      edges: segments.join(''),
      highlight: segments.filter((_, i) => i % 12 === 0).join(''),
    }
  }, [technology.id])

  return (
    <svg className="network-plate" viewBox="0 0 500 400" aria-hidden="true">
      <path d={edges} fill="none" stroke="currentColor" strokeWidth=".6" opacity=".32" />
      <path d={highlight} fill="none" stroke="currentColor" strokeWidth="1" opacity=".72" />
      {vertices.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={(particleSizes[i] * 0.42).toFixed(2)} fill="currentColor" opacity={i % 5 === 0 ? 0.91 : 0.51} />
      ))}
    </svg>
  )
}

export function Intelligence({ motion }: { motion: RefObject<OpticalMotion> }) {
  const [active, setActive] = useState(0)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const frame = useRef<HTMLDivElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const { enabled, near, visible } = useStage(frame)
  const technology = technologies[active]
  const onReady = useCallback(() => setReady(true), [])
  const onFailure = useCallback(() => { setFailed(true); setReady(false) }, [])
  const live = enabled && !failed && near
  useEffect(() => { if (!live) setReady(false) }, [live])

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const { key } = event
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return
    event.preventDefault()
    const offset = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1
    const last = technologies.length - 1
    const next = key === 'Home' ? 0 : key === 'End' ? last : (index + offset + technologies.length) % technologies.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <section
      id="intelligence"
      className="intelligence scene"
      aria-labelledby="intelligence-title"
      style={{ '--mode-color': technology.color } as CSSProperties}
    >
      <div className="shell">
        <div className="section-intro reveal">
          <div>
            <SceneLabel number="03">Intelligence</SceneLabel>
            <h2 id="intelligence-title" className="section-title">THE MIND<br /> <em>BEHIND THE LENS.</em></h2>
          </div>
          <p>Three ways to make sense of the same world. Switch models to see how each one organizes and interprets visual signals.</p>
        </div>
        <div className="intelligence-grid reveal">
          <div
            className="network-frame"
            ref={frame}
            data-network-ready={live && ready}
            onPointerMove={(event) => {
              if (event.pointerType === 'touch' && !event.buttons) return
              const rect = event.currentTarget.getBoundingClientRect()
              motion.current.x = (event.clientX - rect.left) / rect.width * 2 - 1
              motion.current.y = (event.clientY - rect.top) / rect.height * 2 - 1
            }}
            onPointerLeave={() => { motion.current.x = 0; motion.current.y = 0 }}
            onPointerCancel={() => { motion.current.x = 0; motion.current.y = 0 }}
            aria-hidden="true"
          >
            <div className="network-grid" /><div className="network-scope"><i /><i /><i /></div>
            <NetworkPlate technology={technology} />
            {live && (
              <div className="network-canvas">
                <Suspense fallback={null}>
                  <NetworkCanvas technology={technology} motion={motion} visible={visible} onReady={onReady} onFailure={onFailure} />
                </Suspense>
              </div>
            )}
            <span className="network-caption"><Crosshair size={14} /> Neural field</span>
            <span className="network-signal"><Radio size={13} /> {technology.signal} signal</span>
          </div>
          <div className="model-controls">
            <div className="model-tabs" role="tablist" aria-label="AI technologies">
              {technologies.map(({ id, name, Icon }, index) => (
                <button
                  key={id}
                  ref={(node) => { tabs.current[index] = node }}
                  id={`tab-${id}`}
                  type="button"
                  role="tab"
                  aria-controls={`panel-${id}`}
                  aria-selected={active === index}
                  tabIndex={active === index ? 0 : -1}
                  onClick={() => setActive(index)}
                  onKeyDown={(event) => navigate(event, index)}
                >
                  <Icon size={17} strokeWidth={1.6} />{name}
                </button>
              ))}
            </div>
            {technologies.map(({ id, name, title, description, source }, index) => (
              <div
                className="model-panel"
                key={id}
                id={`panel-${id}`}
                role="tabpanel"
                aria-labelledby={`tab-${id}`}
                hidden={active !== index}
              >
                <div className="model-panel-enter">
                  <span className="model-tag">{name}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <a href={source} className="model-source" target="_blank" rel="noreferrer">Read the research <ArrowUpRight size={14} /></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

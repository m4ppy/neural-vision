import { Focus, ScanLine } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { SceneLabel } from './ExhibitionUI'

const targets = [
  { id: '01', name: 'Vehicle', confidence: 98, detail: 'Silver hatchback in the left lane', x: 13.6, y: 50.1, w: 19.0, h: 19.4 },
  { id: '02', name: 'Person', confidence: 99, detail: 'Pedestrian walking away in the center of the frame', x: 46.4, y: 48.2, w: 5.5, h: 19.9 },
  { id: '03', name: 'Cyclist', confidence: 96, detail: 'Cyclist traveling along the right side of the street', x: 72.6, y: 47.8, w: 9.2, h: 22.1 },
] as const

type TargetId = (typeof targets)[number]['id']

export function Perception() {
  const [selected, setSelected] = useState<TargetId | null>(null)
  const [hovered, setHovered] = useState<TargetId | null>(null)
  const [focused, setFocused] = useState<TargetId | null>(null)
  const target = targets.find(({ id }) => id === (hovered ?? focused ?? selected))

  const spot = target ? {
    '--spot-x': `${target.x + target.w / 2}%`,
    '--spot-y': `${target.y + target.h / 2}%`,
  } as CSSProperties : undefined

  function choose(id: TargetId) {
    setSelected((current) => current === id ? null : id)
  }

  return (
    <section
      className="perception scene"
      id="perception"
      aria-labelledby="perception-title"
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        setSelected(null)
        setHovered(null)
        setFocused(null)
      }}
    >
      <div className="shell">
        <div className="section-intro reveal">
          <div>
            <SceneLabel number="02">Perception</SceneLabel>
            <h2 id="perception-title" className="section-title">SEE WHAT<br /> <em>MACHINES SEE.</em></h2>
          </div>
          <p>Through a machine’s eyes, a street becomes a field of signals. Select a detection to see how the optical system reads each object.</p>
        </div>

        <div className="feed reveal">
          <div className="feed-header">
            <span><ScanLine size={15} /> Optical feed</span>
            <span className="feed-source">Simulated input <i /></span>
          </div>
          <div className="feed-viewport" data-tracking={Boolean(target)} style={spot}>
            <div className="feed-camera">
              <div className="feed-world">
                <img src="/media/optical-feed.jpg" loading="lazy" decoding="async" alt="A car, pedestrian and cyclist on a rain-soaked city street at night" />
                <div className="feed-spotlight" aria-hidden="true" />
                <div className="feed-scanline" aria-hidden="true" />
                {targets.map(({ id, name, confidence, x, y, w, h }) => (
                  <button
                    type="button"
                    className="detection"
                    key={id}
                    style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
                    data-active={target?.id === id}
                    aria-label={`${name}, ${confidence}% simulated confidence`}
                    aria-pressed={selected === id}
                    onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(id) }}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) setFocused(id) }}
                    onBlur={() => setFocused(null)}
                    onClick={() => choose(id)}
                  >
                    <span className="detection-label">{name} <b>{confidence}%</b></span>
                    <span className="detection-corners" aria-hidden="true" />
                    <span className="detection-center" aria-hidden="true">+</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="feed-chrome" aria-hidden="true">
              <span className="feed-corner tl" /><span className="feed-corner tr" />
              <span className="feed-corner bl" /><span className="feed-corner br" />
              <span className="feed-rec"><i /> POV</span>
              <span className="feed-count">03 DETECTED</span>
            </div>
          </div>
          <div className="feed-footer">
            <div className="feed-context" aria-live="polite">
              <Focus size={19} strokeWidth={1.5} aria-hidden="true" />
              <div>
                <strong>{target ? `Tracking ${target.id} / ${target.name}` : 'Tracking available'}</strong>
                <p>{target?.detail ?? 'Hover, tap, or focus an object to inspect it.'}</p>
              </div>
            </div>
            <div className="feed-confidence">
              <span>Confidence</span>
              <div className="confidence-track" aria-hidden="true"><i style={{ width: `${target?.confidence ?? 0}%` }} /></div>
              <strong>{target ? `${target.confidence}%` : '—'}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

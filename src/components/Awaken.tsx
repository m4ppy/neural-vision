import { ArrowDown, Crosshair, Move } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import type { OpticalMotion } from '../scene/GlassesCanvas'
import { useStage } from '../scene/useStage'
import { SceneLabel } from './ExhibitionUI'

const GlassesCanvas = lazy(() => import('../scene/GlassesCanvas'))

export function Awaken({ motion }: { motion: RefObject<OpticalMotion> }) {
  const stage = useRef<HTMLDivElement>(null)
  const { enabled, near, visible } = useStage(stage)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const onFailure = useCallback(() => { setFailed(true); setReady(false) }, [])

  function move(event: PointerEvent<HTMLElement>) {
    if ((event.pointerType === 'touch' && !event.buttons) || !stage.current) return
    const area = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - area.left) / area.width * 2 - 1
    const y = (event.clientY - area.top) / area.height * 2 - 1
    motion.current.x = x
    motion.current.y = y
    stage.current.style.setProperty('--pointer-x', `${x * 12}px`)
    stage.current.style.setProperty('--pointer-y', `${y * 9}px`)
  }

  function reset() {
    motion.current.x = 0
    motion.current.y = 0
    stage.current?.style.setProperty('--pointer-x', '0px')
    stage.current?.style.setProperty('--pointer-y', '0px')
  }

  const live = enabled && !failed && near
  useEffect(() => { if (!live) setReady(false) }, [live])

  return (
    <section className="awaken scene" id="awaken" aria-labelledby="awaken-title" onPointerMove={move} onPointerLeave={reset} onPointerCancel={reset}>
      <div className="hero-atmosphere" aria-hidden="true"><div className="hero-grid" /><div className="hero-beam" /></div>
      <div className="shell hero-shell">
        <div className="hero-stage" ref={stage}>
          <div className="hero-art" data-glass-ready={live && ready}>
            <div className="optic-reticle" aria-hidden="true">
              <div className="optic-ring optic-ring-outer" /><div className="optic-ring optic-ring-inner" />
              <div className="optic-axis optic-axis-x" /><div className="optic-axis optic-axis-y" />
              <span className="optic-point first">+</span><span className="optic-point second">+</span>
              <span className="optic-point third">+</span><span className="optic-point fourth">+</span>
            </div>
            <img className="glasses-plate" src="/media/optical-module.png" alt="" fetchPriority="high" />
            {live && (
              <div className="glasses-canvas" aria-hidden="true">
                <Suspense fallback={null}>
                  <GlassesCanvas motion={motion} visible={visible} onReady={onReady} onFailure={onFailure} />
                </Suspense>
              </div>
            )}
          </div>
          <div
            className="hero-inspect-zone"
            aria-hidden="true"
            onPointerDown={(event) => {
              if (event.pointerType === 'touch') event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerUp={(event) => { if (event.pointerType === 'touch') reset() }}
          />
          <div className="optic-label" aria-hidden="true"><Crosshair size={14} strokeWidth={1.4} /><span>Optical module<small>NV–01 / AR LENS</small></span></div>
          <div className="optic-coordinates" aria-hidden="true"><span />{live && ready ? <><Move size={13} /><b className="inspect-mouse">Move to inspect</b><b className="inspect-touch">Drag to inspect</b></> : 'Optical view'}</div>
        </div>
        <div className="hero-copy">
          <SceneLabel number="01">Awaken</SceneLabel>
          <h1 id="awaken-title">
            <span className="hero-line"><span>VISION</span></span>
            <span className="hero-line hero-line-outline"><span>BEYOND</span></span>
            <span className="hero-line"><span>HUMAN<span className="hero-period">.</span></span></span>
          </h1>
          <p className="hero-subtitle">Experience the World Through<br className="desktop-break" /> Artificial Intelligence.</p>
        </div>
        <div className="hero-footer">
          <a className="explore-link" href="#perception"><span><ArrowDown size={18} strokeWidth={1.6} /></span> Scroll to explore</a>
          <div className="hero-index" aria-hidden="true"><strong>01</strong><span /><span /><span /><b>03</b></div>
        </div>
      </div>
    </section>
  )
}

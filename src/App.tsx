import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Awaken } from './components/Awaken'
import { Header, scenes, Wordmark, type SceneId } from './components/ExhibitionUI'
import { Intelligence } from './components/Intelligence'
import { Perception } from './components/Perception'
import type { OpticalMotion } from './scene/GlassesCanvas'

gsap.registerPlugin(ScrollTrigger)

export function App() {
  const root = useRef<HTMLDivElement>(null)
  const optical = useRef<OpticalMotion>({ x: 0, y: 0, scroll: 0 })
  const neural = useRef<OpticalMotion>({ x: 0, y: 0, scroll: 0 })
  const [active, setActive] = useState<SceneId>('awaken')

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const updateActive = () => {
        const line = window.innerHeight * 0.42
        const scene = [...scenes].reverse().find(({ id }) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= line)
        setActive(scene?.id ?? 'awaken')
      }

      const progress = gsap.quickSetter('.site-progress', 'scaleX')
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (trigger) => { progress(trigger.progress); updateActive() },
        onRefresh: (trigger) => { progress(trigger.progress); updateActive() },
      })

      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.hero-line > span', { yPercent: 105, duration: 1.05, stagger: 0.095, ease: 'power4.out', clearProps: 'transform' })
        gsap.from('.hero-copy > p', { opacity: 0, y: 12, duration: 0.75, delay: 0.23, stagger: 0.14, clearProps: 'all' })

        gsap.timeline({ scrollTrigger: { trigger: '#awaken', start: 'top top', end: 'bottom top', scrub: 0.75 } })
          .to(optical.current, { scroll: 1, ease: 'none' }, 0)
          .to('.hero-art', { y: 105, opacity: 0.26, ease: 'none' }, 0)
          .to('.hero-copy', { y: -55, ease: 'none' }, 0)

        gsap.fromTo('.feed-camera', { scale: 1.10 }, {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.feed', start: 'top bottom', end: 'center center', scrub: 0.65 },
        })

        gsap.to(neural.current, {
          scroll: 1, ease: 'none',
          scrollTrigger: { trigger: '#intelligence', start: 'top bottom', end: 'bottom top', scrub: 0.85 },
        })

        gsap.utils.toArray<HTMLElement>('.reveal').forEach((element) => {
          gsap.from(element, {
            opacity: 0.18, y: 32, duration: 0.85, ease: 'power3.out',
            scrollTrigger: { trigger: element, start: 'top 94%', once: true },
          })
        })

        gsap.fromTo('.final-orbit', { scale: 0.85, y: 50 }, {
          scale: 1.18, y: -40, ease: 'none',
          scrollTrigger: { trigger: '.finale', start: 'top bottom', end: 'bottom top', scrub: 0.85 },
        })
      })
      return () => media.revert()
    }, root)

    let mounted = true
    void document.fonts.ready.then(() => { if (mounted) ScrollTrigger.refresh() })
    return () => { mounted = false; context.revert() }
  }, [])

  return (
    <div ref={root}>
      <a href="#main" className="skip-link">Skip to exhibition</a>
      <Header active={active} />
      <main id="main" tabIndex={-1}>
        <Awaken motion={optical} />
        <Perception />
        <Intelligence motion={neural} />
        <section className="finale" aria-labelledby="finale-title">
          <div className="final-orbit" aria-hidden="true"><i /><i /><i /><i /></div>
          <div className="shell finale-inner reveal">
            <h2 id="finale-title">THE FUTURE IS<br /><em>CONTEXT-AWARE.</em></h2>
            <a className="return-link" href="#awaken"><ArrowUp size={16} /> Back to Awaken</a>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="shell footer-inner">
          <Wordmark />
          <span>An exhibition on machine perception</span>
        </div>
      </footer>
    </div>
  )
}

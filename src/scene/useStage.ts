import { useEffect, useState, type RefObject } from 'react'

let canRenderWebGL: boolean | undefined

function supportsWebGL() {
  if (canRenderWebGL !== undefined) return canRenderWebGL
  try {
    const context = document.createElement('canvas').getContext('webgl2', {
      failIfMajorPerformanceCaveat: true,
    })
    canRenderWebGL = Boolean(context)
    context?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    canRenderWebGL = false
  }
  return canRenderWebGL
}

export function useStage(ref: RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false)
  const [visible, setVisible] = useState(false)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const node = ref.current
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setEnabled(!media.matches && supportsWebGL())
    const preload = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { rootMargin: '250px' })
    const viewport = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    update()
    media.addEventListener('change', update)
    preload.observe(node)
    viewport.observe(node)
    return () => {
      media.removeEventListener('change', update)
      preload.disconnect()
      viewport.disconnect()
    }
  }, [ref])

  return { enabled, near, visible }
}

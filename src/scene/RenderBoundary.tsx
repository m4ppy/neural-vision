import { Component, type ReactNode } from 'react'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

export class RenderBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onFailure()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function ContextGuard({ onFailure }: { onFailure: () => void }) {
  const canvas = useThree((state) => state.gl.domElement)
  useEffect(() => {
    const handleLoss = (event: Event) => {
      event.preventDefault()
      onFailure()
    }
    canvas.addEventListener('webglcontextlost', handleLoss)
    return () => canvas.removeEventListener('webglcontextlost', handleLoss)
  }, [canvas, onFailure])
  return null
}

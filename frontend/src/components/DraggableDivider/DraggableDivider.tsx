import { useCallback, useEffect, useState } from 'react'
import './DraggableDivider.css'

interface DraggableDividerProps {
  onResize: (leftWidth: number) => void
  initialLeftWidth?: number
}

export function DraggableDivider({ onResize, initialLeftWidth = 50 }: DraggableDividerProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handlePointerMove = (e: PointerEvent) => {
      const container = document.querySelector('.editor-body') as HTMLElement
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = (x / rect.width) * 100
      const clampedPercentage = Math.min(Math.max(percentage, 20), 80)
      onResize(clampedPercentage)
    }

    const handlePointerUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDragging, onResize])

  return (
    <div
      className={`draggable-divider ${isDragging ? 'dragging' : ''}`}
      onPointerDown={handlePointerDown}
    >
      <div className="draggable-divider-handle" />
    </div>
  )
}

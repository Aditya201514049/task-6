'use client'

import { useState, useRef, useEffect } from 'react'

export default function DraggableWrapper({ 
  children, 
  disabled = false, 
  defaultPosition = { x: 0, y: 0 },
  onStop = () => {},
  onDrag = () => {},
  bounds = null
}) {
  const [position, setPosition] = useState(defaultPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [mouseStart, setMouseStart] = useState({ x: 0, y: 0 })
  const [hasMoved, setHasMoved] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    setPosition(defaultPosition)
  }, [defaultPosition.x, defaultPosition.y])

  const handleMouseDown = (e) => {
    if (disabled) return
    
    // Stop event from bubbling to parent (canvas)
    e.stopPropagation()
    
    const rect = elementRef.current.getBoundingClientRect()
    setMouseStart({ x: e.clientX, y: e.clientY })
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setHasMoved(false)
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e) => {
    const moveDistance = Math.abs(e.clientX - mouseStart.x) + Math.abs(e.clientY - mouseStart.y)
    
    // Only start dragging if mouse has moved more than 3 pixels (reduced threshold)
    if (moveDistance > 3 && !isDragging) {
      setIsDragging(true)
      setHasMoved(true)
    }
    
    if (!isDragging) return
    
    const parent = elementRef.current.parentElement
    const parentRect = parent.getBoundingClientRect()
    
    let newX = e.clientX - parentRect.left - dragStart.x
    let newY = e.clientY - parentRect.top - dragStart.y
    
    // Apply bounds if specified
    if (bounds) {
      if (typeof bounds === 'string' && bounds === 'parent') {
        const elementRect = elementRef.current.getBoundingClientRect()
        newX = Math.max(0, Math.min(newX, parentRect.width - elementRect.width))
        newY = Math.max(0, Math.min(newY, parentRect.height - elementRect.height))
      } else if (typeof bounds === 'object') {
        newX = Math.max(bounds.left || 0, Math.min(newX, bounds.right || Infinity))
        newY = Math.max(bounds.top || 0, Math.min(newY, bounds.bottom || Infinity))
      }
    }
    
    const newPosition = { x: newX, y: newY }
    setPosition(newPosition)
    
    onDrag(e, { x: newX, y: newY })
  }

  const handleMouseUp = (e) => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    
    if (isDragging) {
      setIsDragging(false)
      onStop(e, position)
    }
    
    // Reset states
    setIsDragging(false)
    setHasMoved(false)
  }

  const handleClick = (e) => {
    // Prevent click from bubbling to canvas if we haven't moved (pure click)
    if (!hasMoved) {
      e.stopPropagation()
    }
  }

  const handleDoubleClick = (e) => {
    // Always prevent double-click from bubbling
    e.stopPropagation()
  }

  // Touch events for mobile support
  const handleTouchStart = (e) => {
    if (disabled) return
    
    e.stopPropagation()
    const touch = e.touches[0]
    const rect = elementRef.current.getBoundingClientRect()
    
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    })
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    
    e.preventDefault()
    const touch = e.touches[0]
    const parent = elementRef.current.parentElement
    const parentRect = parent.getBoundingClientRect()
    
    let newX = touch.clientX - parentRect.left - dragStart.x
    let newY = touch.clientY - parentRect.top - dragStart.y
    
    // Apply bounds
    if (bounds === 'parent') {
      const elementRect = elementRef.current.getBoundingClientRect()
      newX = Math.max(0, Math.min(newX, parentRect.width - elementRect.width))
      newY = Math.max(0, Math.min(newY, parentRect.height - elementRect.height))
    }
    
    const newPosition = { x: newX, y: newY }
    setPosition(newPosition)
    
    onDrag(e, { x: newX, y: newY })
  }

  const handleTouchEnd = (e) => {
    if (!isDragging) return
    
    setIsDragging(false)
    onStop(e, position)
  }

  return (
    <div
      ref={elementRef}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: disabled ? 'default' : (isDragging ? 'grabbing' : 'grab'),
        userSelect: isDragging ? 'none' : 'auto',
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}

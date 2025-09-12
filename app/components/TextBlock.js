'use client'

import { useState, useRef, useEffect } from 'react'
import DraggableWrapper from './DraggableWrapper'

export default function TextBlock({
  textBlock, 
  onUpdate, 
  onDelete, 
  isSelected, 
  onSelect,
  canEdit = true,
  isMobile = false
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(textBlock.content || 'Click to edit text')
  const [touchStartTime, setTouchStartTime] = useState(0)
  const textareaRef = useRef(null)

  useEffect(() => {
    setContent(textBlock.content || 'Click to edit text')
  }, [textBlock.content])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    if (canEdit) {
      setIsEditing(true)
    }
  }

  // Mobile touch handlers
  const handleTouchStart = () => {
    setTouchStartTime(Date.now())
  }

  const handleTouchEnd = () => {
    const touchDuration = Date.now() - touchStartTime
    if (touchDuration > 500 && canEdit) { // Long press (500ms)
      setIsEditing(true)
    }
  }

  const handleTextChange = (e) => {
    setContent(e.target.value)
  }

  const handleTextBlur = () => {
    setIsEditing(false)
    const updatedBlock = {
      ...textBlock,
      content: content
    }
    onUpdate(updatedBlock)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextBlur()
    }
    if (e.key === 'Escape') {
      setContent(textBlock.content || 'Click to edit text')
      setIsEditing(false)
    }
  }

  const handleDragStop = (e, data) => {
    onUpdate({
      ...textBlock,
      x: data.x,
      y: data.y
    })
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete(textBlock.id)
  }

  return (
    <DraggableWrapper
      disabled={isEditing || isMobile}
      defaultPosition={{ x: textBlock.x, y: textBlock.y }}
      onStop={handleDragStop}
      bounds="parent"
    >
      <div
        className={`absolute ${isMobile ? 'cursor-pointer' : 'cursor-move'} group ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{
          width: textBlock.width || (isMobile ? 150 : 200),
          height: textBlock.height || (isMobile ? 40 : 50),
          zIndex: textBlock.zIndex || 1
        }}
        onClick={() => onSelect(textBlock.id)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle - hidden on mobile */}
        {!isMobile && <div className="drag-handle absolute inset-0" />}
        
        {/* Delete Button */}
        {isSelected && canEdit && (
          <button
            onClick={handleDelete}
            className={`absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-opacity flex items-center justify-center ${
              isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            title="Delete text block"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
        )}

        {/* Text Content */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleKeyDown}
            className={`w-full h-full resize-none border-2 border-blue-500 rounded px-2 py-1 focus:outline-none ${
              isMobile ? 'text-sm' : 'text-sm'
            }`}
            style={{
              fontSize: textBlock.fontSize || (isMobile ? 14 : 16),
              fontWeight: textBlock.fontWeight || 'normal',
              color: textBlock.color || '#000000',
              backgroundColor: textBlock.backgroundColor || 'transparent',
              textAlign: textBlock.textAlign || 'left'
            }}
          />
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            className={`w-full h-full px-2 py-1 border border-transparent hover:border-gray-300 rounded ${
              isMobile ? 'cursor-pointer' : 'cursor-text'
            }`}
            style={{
              fontSize: textBlock.fontSize || (isMobile ? 14 : 16),
              fontWeight: textBlock.fontWeight || 'normal',
              color: textBlock.color || '#000000',
              backgroundColor: textBlock.backgroundColor || 'transparent',
              textAlign: textBlock.textAlign || 'left',
              wordWrap: 'break-word',
              overflow: 'hidden'
            }}
          >
            {content || (isMobile ? 'Long press to edit' : 'Click to edit text')}
          </div>
        )}

        {/* Resize Handles - hidden on mobile */}
        {isSelected && canEdit && !isEditing && !isMobile && (
          <>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize" />
            <div className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 cursor-sw-resize" />
            <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 cursor-ne-resize" />
            <div className="absolute top-0 left-0 w-3 h-3 bg-blue-500 cursor-nw-resize" />
          </>
        )}
      </div>
    </DraggableWrapper>
  )
}
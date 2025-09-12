'use client'

import { useState, useRef, useEffect } from 'react'
import DraggableWrapper from './DraggableWrapper'

export default function TextBlock({
  textBlock, 
  onUpdate, 
  onDelete, 
  isSelected, 
  onSelect,
  canEdit = true 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(textBlock.content || 'Click to edit text')
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

  const handleTextChange = (e) => {
    setContent(e.target.value)
  }

  const handleTextBlur = () => {
    console.log('TextBlock handleTextBlur called')
    console.log('Current content:', content)
    console.log('Original textBlock:', textBlock)
    
    setIsEditing(false)
    const updatedBlock = {
      ...textBlock,
      content: content
    }
    console.log('Calling onUpdate with:', updatedBlock)
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
      disabled={isEditing}
      defaultPosition={{ x: textBlock.x, y: textBlock.y }}
      onStop={handleDragStop}
      bounds="parent"
    >
      <div
        className={`absolute cursor-move group ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{
          width: textBlock.width || 200,
          height: textBlock.height || 50,
          zIndex: textBlock.zIndex || 1
        }}
        onClick={() => onSelect(textBlock.id)}
      >
        {/* Drag Handle */}
        <div className="drag-handle absolute inset-0" />
        
        {/* Delete Button */}
        {isSelected && canEdit && (
          <button
            onClick={handleDelete}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
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
            className="w-full h-full resize-none border-2 border-blue-500 rounded px-2 py-1 text-sm focus:outline-none"
            style={{
              fontSize: textBlock.fontSize || 16,
              fontWeight: textBlock.fontWeight || 'normal',
              color: textBlock.color || '#000000',
              backgroundColor: textBlock.backgroundColor || 'transparent',
              textAlign: textBlock.textAlign || 'left'
            }}
          />
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            className="w-full h-full px-2 py-1 border border-transparent hover:border-gray-300 rounded cursor-text"
            style={{
              fontSize: textBlock.fontSize || 16,
              fontWeight: textBlock.fontWeight || 'normal',
              color: textBlock.color || '#000000',
              backgroundColor: textBlock.backgroundColor || 'transparent',
              textAlign: textBlock.textAlign || 'left',
              wordWrap: 'break-word',
              overflow: 'hidden'
            }}
          >
            {content || 'Click to edit text'}
          </div>
        )}

        {/* Resize Handles */}
        {isSelected && canEdit && !isEditing && (
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
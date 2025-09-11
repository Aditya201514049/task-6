'use client'

import { useState, useRef, useEffect } from 'react'
import Draggable from 'react-draggable'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

export default function MarkdownTextBlock({ 
  block, 
  onUpdate, 
  onDelete, 
  disabled = false 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(block.content || '')
  const [showToolbar, setShowToolbar] = useState(false)
  const textareaRef = useRef(null)
  const blockRef = useRef(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  // Configure marked for safe rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false
  })

  const handleDoubleClick = (e) => {
    if (disabled) return
    e.stopPropagation()
    setIsEditing(true)
    setEditContent(block.content || '')
  }

  const handleSave = () => {
    onUpdate({
      content: editContent,
      lastModified: new Date().toISOString()
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(block.content || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm('Delete this text block?')) {
      onDelete()
    }
  }

  const insertMarkdown = (syntax) => {
    if (!textareaRef.current) return
    
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = editContent.substring(start, end)
    
    let newText = ''
    let cursorOffset = 0
    
    switch (syntax) {
      case 'bold':
        newText = `**${selectedText || 'bold text'}**`
        cursorOffset = selectedText ? 2 : 2
        break
      case 'italic':
        newText = `*${selectedText || 'italic text'}*`
        cursorOffset = selectedText ? 1 : 1
        break
      case 'header':
        newText = `## ${selectedText || 'Header'}`
        cursorOffset = selectedText ? 3 : 3
        break
      case 'list':
        newText = `- ${selectedText || 'List item'}`
        cursorOffset = selectedText ? 2 : 2
        break
      case 'code':
        newText = `\`${selectedText || 'code'}\``
        cursorOffset = selectedText ? 1 : 1
        break
      default:
        return
    }
    
    const newContent = editContent.substring(0, start) + newText + editContent.substring(end)
    setEditContent(newContent)
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + (selectedText ? newText.length : cursorOffset)
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const renderMarkdown = (content) => {
    if (!content) return ''
    try {
      const html = marked(content)
      return DOMPurify.sanitize(html)
    } catch (error) {
      console.error('Markdown parsing error:', error)
      return content
    }
  }

  return (
    <Draggable
      disabled={isEditing || disabled}
      defaultPosition={{ x: block.x, y: block.y }}
      onStop={(e, data) => {
        onUpdate({
          x: data.x,
          y: data.y
        })
      }}
      handle=".drag-handle"
    >
      <div
        ref={blockRef}
        className={`absolute select-none ${disabled ? 'pointer-events-none' : ''}`}
        style={{
          width: `${block.width}px`,
          minHeight: `${block.height}px`,
          zIndex: isEditing ? 1000 : 1
        }}
        onMouseEnter={() => !disabled && setShowToolbar(true)}
        onMouseLeave={() => !isEditing && setShowToolbar(false)}
      >
        {/* Toolbar */}
        {showToolbar && !disabled && (
          <div className="absolute -top-10 left-0 bg-gray-800 text-white rounded-lg px-2 py-1 flex items-center space-x-1 text-xs z-50">
            {isEditing ? (
              <>
                <button
                  onClick={() => insertMarkdown('bold')}
                  className="px-2 py-1 hover:bg-gray-700 rounded"
                  title="Bold (Ctrl+B)"
                >
                  <strong>B</strong>
                </button>
                <button
                  onClick={() => insertMarkdown('italic')}
                  className="px-2 py-1 hover:bg-gray-700 rounded italic"
                  title="Italic (Ctrl+I)"
                >
                  I
                </button>
                <button
                  onClick={() => insertMarkdown('header')}
                  className="px-2 py-1 hover:bg-gray-700 rounded"
                  title="Header"
                >
                  H
                </button>
                <button
                  onClick={() => insertMarkdown('list')}
                  className="px-2 py-1 hover:bg-gray-700 rounded"
                  title="List"
                >
                  •
                </button>
                <button
                  onClick={() => insertMarkdown('code')}
                  className="px-2 py-1 hover:bg-gray-700 rounded font-mono"
                  title="Code"
                >
                  &lt;&gt;
                </button>
                <div className="w-px h-4 bg-gray-600"></div>
                <button
                  onClick={handleSave}
                  className="px-2 py-1 hover:bg-green-700 rounded text-green-300"
                  title="Save (Ctrl+Enter)"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancel}
                  className="px-2 py-1 hover:bg-red-700 rounded text-red-300"
                  title="Cancel (Esc)"
                >
                  ✕
                </button>
              </>
            ) : (
              <>
                <div className="drag-handle px-2 py-1 hover:bg-gray-700 rounded cursor-move" title="Drag to move">
                  ⋮⋮
                </div>
                <button
                  onClick={handleDelete}
                  className="px-2 py-1 hover:bg-red-700 rounded text-red-300"
                  title="Delete"
                >
                  🗑
                </button>
              </>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={`w-full h-full p-3 rounded-lg border-2 transition-all duration-200 ${
            isEditing 
              ? 'border-blue-500 bg-white shadow-lg' 
              : showToolbar 
                ? 'border-blue-300 bg-white shadow-sm' 
                : 'border-transparent bg-white hover:border-gray-300'
          }`}
          style={{
            fontSize: `${block.fontSize || 16}px`,
            fontFamily: block.fontFamily || 'Arial',
            color: block.color || '#000000',
            backgroundColor: block.backgroundColor || 'transparent'
          }}
          onDoubleClick={handleDoubleClick}
        >
          {isEditing ? (
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-32 p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Type your content... Use **bold**, *italic*, ## headers, - lists, `code`"
                style={{
                  fontSize: `${block.fontSize || 16}px`,
                  fontFamily: block.fontFamily || 'Arial'
                }}
              />
              <div className="mt-2 text-xs text-gray-500">
                <strong>Markdown shortcuts:</strong> **bold**, *italic*, ## header, - list, `code`
                <br />
                <strong>Save:</strong> Ctrl+Enter | <strong>Cancel:</strong> Esc
              </div>
            </div>
          ) : (
            <div
              className="markdown-content min-h-8 cursor-pointer"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(block.content || 'Double-click to edit')
              }}
            />
          )}
        </div>
      </div>
    </Draggable>
  )
}

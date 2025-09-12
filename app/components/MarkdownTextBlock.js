'use client'

import { useState, useRef, useEffect } from 'react'
import DraggableWrapper from './DraggableWrapper'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

export default function MarkdownTextBlock({
  block,
  onUpdate,
  onDelete,
  disabled = false,
  useMarkdown = true
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(block.content || '')
  const textareaRef = useRef(null)

  // Configure marked for safe rendering
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false
  })

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

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(editContent.length, editContent.length)
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    if (disabled) return
    setIsEditing(true)
    setEditContent(block.content || '')
  }

  const handleSave = () => {
    onUpdate(block.id, { content: editContent })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(block.content || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const handleDragStop = (e, data) => {
    onUpdate(block.id, { x: data.x, y: data.y })
  }

  const handleDelete = () => {
    if (disabled) return
    onDelete(block.id)
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
        newText = `**${selectedText}**`
        cursorOffset = selectedText ? 0 : 2
        break
      case 'italic':
        newText = `*${selectedText}*`
        cursorOffset = selectedText ? 0 : 1
        break
      case 'header':
        newText = `## ${selectedText}`
        cursorOffset = selectedText ? 0 : 3
        break
      case 'list':
        newText = `- ${selectedText}`
        cursorOffset = selectedText ? 0 : 2
        break
      case 'code':
        newText = `\`${selectedText}\``
        cursorOffset = selectedText ? 0 : 1
        break
      default:
        return
    }
    
    const newContent = editContent.substring(0, start) + newText + editContent.substring(end)
    setEditContent(newContent)
    
    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + newText.length - cursorOffset
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }

  // Determine if we should use markdown rendering
  const shouldUseMarkdown = useMarkdown && (block.isMarkdown !== false) && 
    (block.isMarkdown || block.content?.includes('**') || block.content?.includes('*') || block.content?.includes('#'))

  return (
    <DraggableWrapper
      disabled={isEditing || disabled}
      defaultPosition={{ x: block.x, y: block.y }}
      onStop={handleDragStop}
      bounds="parent"
    >
      <div
        className={`
          min-w-32 min-h-8 p-2 border-2 rounded-lg relative group
          ${isEditing 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-white hover:border-gray-400'
          }
          ${disabled ? 'cursor-default' : 'cursor-move'}
        `}
        style={{
          width: `${block.width}px`,
          minHeight: `${block.height}px`,
          fontSize: `${block.fontSize || 16}px`,
          fontFamily: block.fontFamily || 'Arial',
          color: block.color || '#000000',
          backgroundColor: block.backgroundColor || 'transparent'
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* Delete button */}
        {!disabled && !isEditing && (
          <button
            onClick={handleDelete}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            ×
          </button>
        )}

        {isEditing ? (
          <div className="space-y-2">
            {/* Formatting toolbar */}
            {useMarkdown && (
              <div className="flex flex-wrap gap-1 p-2 bg-gray-100 rounded border-b">
                <button
                  type="button"
                  onClick={() => insertMarkdown('bold')}
                  className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                  title="Bold (Ctrl+B)"
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('italic')}
                  className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50 italic"
                  title="Italic (Ctrl+I)"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('header')}
                  className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                  title="Header"
                >
                  H
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('list')}
                  className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                  title="List"
                >
                  •
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('code')}
                  className="px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50 font-mono"
                  title="Code"
                >
                  &lt;/&gt;
                </button>
              </div>
            )}
            
            {/* Text editor */}
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
            
            {/* Action buttons */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {shouldUseMarkdown ? (
              <div
                className="markdown-content"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(block.content || '')
                }}
                style={{
                  fontSize: `${block.fontSize || 16}px`,
                  fontFamily: block.fontFamily || 'Arial',
                  color: block.color || '#000000'
                }}
              />
            ) : (
              block.content || 'Double-click to edit'
            )}
          </div>
        )}
      </div>
    </DraggableWrapper>
  )
}

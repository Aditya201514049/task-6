'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import TextBlock from '../../components/TextBlock'

export default function PresentationEditor() {
  const params = useParams()
  const presentationId = params.id
  const [presentation, setPresentation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [selectedTextBlockId, setSelectedTextBlockId] = useState(null)
  const [nickname, setNickname] = useState('')

  useEffect(() => {
    // Get nickname from localStorage
    const storedNickname = localStorage.getItem('userNickname')
    if (storedNickname) {
      setNickname(storedNickname)
    }
    
    fetchPresentation()
  }, [presentationId])

  const fetchPresentation = async () => {
    try {
      const response = await fetch(`/api/presentations/${presentationId}`)
      const data = await response.json()
      
      if (data.success) {
        setPresentation(data.presentation)
      } else {
        setError('Presentation not found')
      }
    } catch (err) {
      setError('Failed to load presentation')
    } finally {
      setLoading(false)
    }
  }

  const generateTextBlockId = () => {
    return `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const handleCanvasClick = (e) => {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - 20 // Offset for padding
    const y = e.clientY - rect.top - 20

    // Don't create if clicking on existing text block
    if (e.target !== canvas) return

    const newTextBlock = {
      id: generateTextBlockId(),
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: 200,
      height: 50,
      content: 'New text block',
      fontSize: 16,
      fontWeight: 'normal',
      color: '#000000',
      backgroundColor: 'transparent',
      textAlign: 'left',
      zIndex: 1
    }

    const updatedPresentation = { ...presentation }
    const currentSlide = updatedPresentation.slides[currentSlideIndex]
    
    if (!currentSlide.textBlocks) {
      currentSlide.textBlocks = []
    }
    
    currentSlide.textBlocks.push(newTextBlock)
    setPresentation(updatedPresentation)
    setSelectedTextBlockId(newTextBlock.id)

    // Save to backend
    updateSlideInBackend(currentSlide)
  }

  const handleTextBlockUpdate = (updatedTextBlock) => {
    const updatedPresentation = { ...presentation }
    const currentSlide = updatedPresentation.slides[currentSlideIndex]
    
    const textBlockIndex = currentSlide.textBlocks.findIndex(
      tb => tb.id === updatedTextBlock.id
    )
    
    if (textBlockIndex !== -1) {
      currentSlide.textBlocks[textBlockIndex] = updatedTextBlock
      setPresentation(updatedPresentation)
      
      // Save to backend
      updateSlideInBackend(currentSlide)
    }
  }

  const handleTextBlockDelete = (textBlockId) => {
    const updatedPresentation = { ...presentation }
    const currentSlide = updatedPresentation.slides[currentSlideIndex]
    
    currentSlide.textBlocks = currentSlide.textBlocks.filter(
      tb => tb.id !== textBlockId
    )
    
    setPresentation(updatedPresentation)
    setSelectedTextBlockId(null)
    
    // Save to backend
    updateSlideInBackend(currentSlide)
  }

  const updateSlideInBackend = async (slide) => {
    try {
      await fetch(`/api/presentations/${presentationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: presentation.slides
        })
      })
    } catch (error) {
      console.error('Error updating slide:', error)
    }
  }

  const handleSlideSelect = (index) => {
    setCurrentSlideIndex(index)
    setSelectedTextBlockId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading presentation...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">{error}</div>
          <a href="/" className="text-blue-600 hover:underline">
            ← Back to presentations
          </a>
        </div>
      </div>
    )
  }

  const currentSlide = presentation?.slides?.[currentSlideIndex]
  const canEdit = presentation?.createdBy === nickname

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Toolbar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-gray-600 hover:text-gray-900">
              ← Back
            </a>
            <h1 className="text-xl font-semibold text-gray-900">
              {presentation?.title || 'Untitled Presentation'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {nickname && `${nickname} • `}
              {canEdit ? 'Editor' : 'Viewer'}
            </span>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              Present
            </button>
          </div>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex">
        {/* Left Panel - Slides */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-4">Slides</h3>
          <div className="space-y-2">
            {presentation?.slides?.map((slide, index) => (
              <div
                key={slide.id}
                onClick={() => handleSlideSelect(index)}
                className={`aspect-video bg-gray-50 border-2 rounded p-2 cursor-pointer transition-colors ${
                  index === currentSlideIndex 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-xs text-gray-600">
                  {index + 1}. {slide.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {slide.textBlocks?.length || 0} text blocks
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Panel - Main Canvas */}
        <div className="flex-1 p-8">
          <div className="bg-white shadow-lg rounded-lg aspect-video max-w-4xl mx-auto relative overflow-hidden">
            {/* Canvas Area */}
            <div 
              className="absolute inset-4 rounded cursor-crosshair"
              onClick={canEdit ? handleCanvasClick : undefined}
              style={{ backgroundColor: currentSlide?.backgroundColor || '#ffffff' }}
            >
              {/* Text Blocks */}
              {currentSlide?.textBlocks?.map((textBlock) => (
                <TextBlock
                  key={textBlock.id}
                  textBlock={textBlock}
                  onUpdate={handleTextBlockUpdate}
                  onDelete={handleTextBlockDelete}
                  isSelected={selectedTextBlockId === textBlock.id}
                  onSelect={setSelectedTextBlockId}
                  canEdit={canEdit}
                />
              ))}
              
              {/* Empty State */}
              {(!currentSlide?.textBlocks || currentSlide.textBlocks.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
                  <div className="text-center text-gray-500">
                    <div className="text-lg mb-2">
                      {canEdit ? 'Click to add text blocks' : 'No content yet'}
                    </div>
                    {canEdit && (
                      <div className="text-sm">Double-click text to edit</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Users */}
        <div className="w-64 bg-white border-l border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-4">Connected Users</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">{presentation?.createdBy} (Creator)</span>
            </div>
            {nickname && nickname !== presentation?.createdBy && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">{nickname} (You)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
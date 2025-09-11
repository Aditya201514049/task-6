
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSocket from '../../../hooks/useSocket'

export default function PresentMode() {
  const params = useParams()
  const router = useRouter()
  const presentationId = params.id

  const [presentation, setPresentation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [nickname, setNickname] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Initialize WebSocket connection for real-time updates
  const {
    isConnected,
    onTextBlockUpdate,
    onTextBlockAdd,
    onTextBlockDelete,
    onSlideAdd,
    onPresentationUpdate
  } = useSocket(presentationId, nickname)

  useEffect(() => {
    // Get nickname from localStorage
    const storedNickname = localStorage.getItem('nickname')
    if (storedNickname) {
      setNickname(storedNickname)
    }
  }, [])

  useEffect(() => {
    if (presentationId) {
      fetchPresentation()
    }
  }, [presentationId])

  // Set up real-time event listeners
  useEffect(() => {
    if (!nickname || !presentationId) return

    const unsubscribeTextBlockUpdate = onTextBlockUpdate?.((data) => {
      setPresentation(prev => {
        if (!prev) return prev
        const updatedSlides = prev.slides.map(slide => {
          if (slide.id === data.slideId) {
            const updatedTextBlocks = slide.textBlocks.map(block =>
              block.id === data.blockId ? { ...block, ...data.updates } : block
            )
            return { ...slide, textBlocks: updatedTextBlocks }
          }
          return slide
        })
        return { ...prev, slides: updatedSlides }
      })
    })

    const unsubscribeTextBlockAdd = onTextBlockAdd?.((data) => {
      setPresentation(prev => {
        if (!prev) return prev
        const updatedSlides = prev.slides.map(slide => {
          if (slide.id === data.slideId) {
            return {
              ...slide,
              textBlocks: [...(slide.textBlocks || []), data.textBlock]
            }
          }
          return slide
        })
        return { ...prev, slides: updatedSlides }
      })
    })

    const unsubscribeTextBlockDelete = onTextBlockDelete?.((data) => {
      setPresentation(prev => {
        if (!prev) return prev
        const updatedSlides = prev.slides.map(slide => {
          if (slide.id === data.slideId) {
            return {
              ...slide,
              textBlocks: slide.textBlocks.filter(block => block.id !== data.blockId)
            }
          }
          return slide
        })
        return { ...prev, slides: updatedSlides }
      })
    })

    const unsubscribeSlideAdd = onSlideAdd?.((data) => {
      setPresentation(prev => {
        if (!prev) return prev
        return {
          ...prev,
          slides: [...prev.slides, data.slide]
        }
      })
    })

    const unsubscribePresentationUpdate = onPresentationUpdate?.((data) => {
      fetchPresentation()
    })

    return () => {
      unsubscribeTextBlockUpdate?.()
      unsubscribeTextBlockAdd?.()
      unsubscribeTextBlockDelete?.()
      unsubscribeSlideAdd?.()
      unsubscribePresentationUpdate?.()
    }
  }, [nickname, presentationId, onTextBlockUpdate, onTextBlockAdd, onTextBlockDelete, onSlideAdd, onPresentationUpdate])

  // Keyboard navigation
  const handleKeyPress = useCallback((e) => {
    if (!presentation?.slides) return

    switch (e.key) {
      case 'ArrowRight':
      case ' ':
      case 'PageDown':
        e.preventDefault()
        nextSlide()
        break
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault()
        prevSlide()
        break
      case 'Home':
        e.preventDefault()
        setCurrentSlideIndex(0)
        break
      case 'End':
        e.preventDefault()
        setCurrentSlideIndex(presentation.slides.length - 1)
        break
      case 'Escape':
        e.preventDefault()
        exitPresentation()
        break
      case 'f':
      case 'F11':
        e.preventDefault()
        toggleFullscreen()
        break
    }
  }, [presentation?.slides])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const fetchPresentation = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/presentations/${presentationId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch presentation')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setPresentation(data.presentation)
      } else {
        throw new Error(data.error || 'Failed to load presentation')
      }
    } catch (err) {
      console.error('Error fetching presentation:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    if (presentation?.slides && currentSlideIndex < presentation.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
  }

  const goToSlide = (index) => {
    if (presentation?.slides && index >= 0 && index < presentation.slides.length) {
      setCurrentSlideIndex(index)
    }
  }

  const exitPresentation = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
    router.push(`/presentation/${presentationId}`)
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading presentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ Error</div>
          <p className="mb-4">{error}</p>
          <button 
            onClick={fetchPresentation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!presentation || !presentation.slides?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>No slides to present</p>
      </div>
    )
  }

  const currentSlide = presentation.slides[currentSlideIndex]

  return (
    <div className="h-screen bg-black text-white flex flex-col relative">
      {/* Top Controls Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-black bg-opacity-50 p-4 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center space-x-4">
          <button
            onClick={exitPresentation}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Exit
          </button>
          <h1 className="text-lg font-semibold">{presentation.title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            {currentSlideIndex + 1} / {presentation.slides.length}
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Main Slide Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div 
          className="w-full h-full max-w-6xl max-h-4xl relative rounded-lg shadow-2xl"
          style={{ 
            backgroundColor: currentSlide.backgroundColor || '#ffffff',
            aspectRatio: '16/9'
          }}
        >
          {/* Slide Title */}
          <div className="absolute top-8 left-8 right-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              {currentSlide.title}
            </h2>
          </div>

          {/* Text Blocks */}
          {currentSlide.textBlocks?.map((block) => (
            <div
              key={block.id}
              className="absolute pointer-events-none"
              style={{
                left: `${block.x}px`,
                top: `${block.y}px`,
                width: `${block.width}px`,
                minHeight: `${block.height}px`,
                fontSize: `${block.fontSize * 1.5}px`, // Scale up for presentation
                fontFamily: block.fontFamily || 'Arial',
                color: block.color || '#000000',
                backgroundColor: block.backgroundColor || 'transparent',
                padding: '8px',
                borderRadius: '4px',
                lineHeight: '1.4',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}
            >
              {block.content}
            </div>
          ))}

          {/* Empty slide message */}
          {(!currentSlide.textBlocks || currentSlide.textBlocks.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-gray-400 text-2xl">
                Empty slide
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-black bg-opacity-50 p-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={prevSlide}
            disabled={currentSlideIndex === 0}
            className={`px-4 py-2 rounded ${
              currentSlideIndex === 0 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            ← Previous
          </button>

          {/* Slide Indicators */}
          <div className="flex space-x-2">
            {presentation.slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full ${
                  index === currentSlideIndex 
                    ? 'bg-blue-500' 
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            disabled={currentSlideIndex === presentation.slides.length - 1}
            className={`px-4 py-2 rounded ${
              currentSlideIndex === presentation.slides.length - 1
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 right-4 z-40 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black bg-opacity-75 p-3 rounded text-xs">
          <div className="text-gray-300 mb-1">Keyboard Shortcuts:</div>
          <div className="text-gray-400">
            <div>← → Space: Navigate slides</div>
            <div>F / F11: Toggle fullscreen</div>
            <div>Esc: Exit presentation</div>
          </div>
        </div>
      </div>

      {/* Click areas for navigation */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-30"
        onClick={prevSlide}
      />
      <div 
        className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-30"
        onClick={nextSlide}
      />
    </div>
  )
}
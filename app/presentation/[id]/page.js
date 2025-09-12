'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import TextBlock from '../../components/TextBlock'
import MarkdownTextBlock from '../../components/MarkdownTextBlock'
import SlidePanel from '../../components/SlidePanel'
import UserAccessManager from '../../components/UserAccessManager'
import useSocket from '../../hooks/useSocket'

export default function PresentationEditor() {
  const params = useParams()
  const presentationId = params.id

  const [presentation, setPresentation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSlideId, setSelectedSlideId] = useState(null)
  const [nickname, setNickname] = useState('')
  const [useMarkdown, setUseMarkdown] = useState(true) // Default to markdown mode
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, slidePosition: null })

  // Initialize WebSocket connection
  const {
    isConnected,
    connectedUsers: socketConnectedUsers,
    error: socketError,
    emitTextBlockUpdate,
    emitTextBlockAdd,
    emitTextBlockDelete,
    emitSlideAdd,
    emitSlideDelete,
    onTextBlockUpdate,
    onTextBlockAdd,
    onTextBlockDelete,
    onSlideAdd,
    onSlideDelete,
    onPresentationUpdate
  } = useSocket(presentationId, nickname)

  // Get current user info
  const isCreator = presentation?.createdBy === nickname
  
  // Check authorized users for role
  const authorizedUser = presentation?.authorizedUsers?.find(user => user.nickname === nickname)
  const currentUser = presentation?.connectedUsers?.find(user => user.nickname === nickname)
  
  // Determine user role: Creator > Authorized User > Connected User > Default Viewer
  let userRole = 'Viewer'
  if (isCreator) {
    userRole = 'Creator'
  } else if (authorizedUser) {
    userRole = authorizedUser.role === 'editor' ? 'Editor' : 'Viewer'
  } else if (currentUser) {
    userRole = currentUser.role === 'editor' ? 'Editor' : 'Viewer'
  }

  useEffect(() => {
    // Get nickname from localStorage
    const storedNickname = localStorage.getItem('userNickname')
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
      if (data.updatedBy !== nickname) {
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
      }
    })

    const unsubscribeTextBlockAdd = onTextBlockAdd?.((data) => {
      if (data.addedBy !== nickname) {
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
      }
    })

    const unsubscribeTextBlockDelete = onTextBlockDelete?.((data) => {
      if (data.deletedBy !== nickname) {
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
      }
    })

    const unsubscribeSlideAdd = onSlideAdd?.((data) => {
      if (data.addedBy !== nickname) {
        setPresentation(prev => {
          if (!prev) return prev
          return {
            ...prev,
            slides: [...prev.slides, data.slide]
          }
        })
      }
    })

    const unsubscribeSlideDelete = onSlideDelete?.((data) => {
      if (data.deletedBy !== nickname) {
        setPresentation(prev => {
          if (!prev) return prev
          return {
            ...prev,
            slides: prev.slides.filter(slide => slide.id !== data.slideId)
          }
        })
      }
    })

    const unsubscribePresentationUpdate = onPresentationUpdate?.((data) => {
      // Refresh presentation data when major updates occur
      fetchPresentation()
    })

    return () => {
      unsubscribeTextBlockUpdate?.()
      unsubscribeTextBlockAdd?.()
      unsubscribeTextBlockDelete?.()
      unsubscribeSlideAdd?.()
      unsubscribeSlideDelete?.()
      unsubscribePresentationUpdate?.()
    }
  }, [nickname, presentationId, onTextBlockUpdate, onTextBlockAdd, onTextBlockDelete, onSlideAdd, onSlideDelete, onPresentationUpdate])

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
        // Select first slide by default
        if (data.presentation.slides?.length > 0 && !selectedSlideId) {
          setSelectedSlideId(data.presentation.slides[0].id)
        }
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

  const handleAddSlide = async () => {
    if (!isCreator && userRole !== 'Editor') return

    try {
      const response = await fetch(`/api/presentations/${presentationId}/slides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createdBy: nickname,
          title: `Slide ${presentation.slides.length + 1}`
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to add slide`)
      }
      
      if (data.success) {
        // Emit real-time update
        emitSlideAdd(data.slide)
        
        // Refresh presentation data
        await fetchPresentation()
        // Select the new slide
        if (data.slide) {
          setSelectedSlideId(data.slide.id)
        }
      } else {
        throw new Error(data.error || 'Failed to add slide')
      }
    } catch (err) {
      console.error('Error adding slide:', err)
      alert('Failed to add slide: ' + err.message)
    }
  }

  const handleSlideSelect = (slideId) => {
    setSelectedSlideId(slideId)
  }

  const handleDeleteSlide = async (slideId) => {
    try {
      const response = await fetch(`/api/presentations/${presentationId}/slides/${slideId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createdBy: nickname
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to delete slide`)
      }
      
      if (data.success) {
        // Emit real-time update
        emitSlideDelete(slideId)
        
        // Refresh presentation data
        await fetchPresentation()
        
        // If deleted slide was selected, select the first slide
        if (selectedSlideId === slideId) {
          const remainingSlides = presentation.slides.filter(slide => slide.id !== slideId)
          if (remainingSlides.length > 0) {
            setSelectedSlideId(remainingSlides[0].id)
          }
        }
      } else {
        throw new Error(data.error || 'Failed to delete slide')
      }
    } catch (err) {
      console.error('Error deleting slide:', err)
      throw err // Re-throw to be handled by SlidePanel
    }
  }

  const handleTextBlockUpdate = async (slideId, updatedBlock) => {
    console.log('handleTextBlockUpdate called with:', { slideId, updatedBlock })
    
    try {
      // Find the slide and update the text block
      const updatedSlides = presentation.slides.map(slide => {
        if (slide.id === slideId) {
          const updatedTextBlocks = slide.textBlocks.map(block => 
            block.id === updatedBlock.id ? updatedBlock : block
          )
          console.log('Updated textBlocks for slide:', updatedTextBlocks)
          return { ...slide, textBlocks: updatedTextBlocks }
        }
        return slide
      })

      console.log('About to update presentation state with slides:', updatedSlides)
      
      // Update local state immediately for responsiveness
      setPresentation(prev => ({ ...prev, slides: updatedSlides }))

      // Emit real-time update
      emitTextBlockUpdate(slideId, updatedBlock.id, updatedBlock)

      // Send update to backend
      const response = await fetch(`/api/presentations/${presentationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slides: updatedSlides
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update presentation')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to update presentation')
      }

      console.log('Backend update successful')
    } catch (err) {
      console.error('Error updating text block:', err)
      // Revert local changes on error
      fetchPresentation()
    }
  }

  const handleTextBlockAdd = async (slideId, position) => {
    if (userRole === 'Viewer') return

    try {
      const newBlock = {
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: useMarkdown ? '**New text block**\n\nDouble-click to edit with markdown support!' : 'New text block',
        x: position.x,
        y: position.y,
        width: 200,
        height: 50,
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
        backgroundColor: 'transparent',
        isMarkdown: useMarkdown
      }

      const updatedSlides = presentation.slides.map(slide => {
        if (slide.id === slideId) {
          return { 
            ...slide, 
            textBlocks: [...(slide.textBlocks || []), newBlock] 
          }
        }
        return slide
      })

      // Update local state immediately
      setPresentation(prev => ({ ...prev, slides: updatedSlides }))

      // Emit real-time update
      emitTextBlockAdd(slideId, newBlock)

      // Send update to backend
      const response = await fetch(`/api/presentations/${presentationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slides: updatedSlides
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add text block')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to add text block')
      }
    } catch (err) {
      console.error('Error adding text block:', err)
      // Revert local changes on error
      fetchPresentation()
    }
  }

  const handleTextBlockDelete = async (slideId, blockId) => {
    if (userRole === 'Viewer') return

    try {
      const updatedSlides = presentation.slides.map(slide => {
        if (slide.id === slideId) {
          return { 
            ...slide, 
            textBlocks: slide.textBlocks.filter(block => block.id !== blockId)
          }
        }
        return slide
      })

      // Update local state immediately
      setPresentation(prev => ({ ...prev, slides: updatedSlides }))

      // Emit real-time update
      emitTextBlockDelete(slideId, blockId)

      // Send update to backend
      const response = await fetch(`/api/presentations/${presentationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slides: updatedSlides
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete text block')
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete text block')
      }
    } catch (err) {
      console.error('Error deleting text block:', err)
      // Revert local changes on error
      fetchPresentation()
    }
  }

  const handleUserAdded = (newUser) => {
    setPresentation(prev => ({
      ...prev,
      authorizedUsers: [...(prev.authorizedUsers || []), newUser]
    }))
  }

  const handleUserRemoved = (nickname) => {
    setPresentation(prev => ({
      ...prev,
      authorizedUsers: (prev.authorizedUsers || []).filter(user => user.nickname !== nickname)
    }))
  }

  const handleSettingsUpdated = (newSettings) => {
    setPresentation(prev => ({
      ...prev,
      settings: newSettings
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading presentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
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

  if (!presentation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Presentation not found</p>
      </div>
    )
  }

  const currentSlide = presentation.slides?.find(slide => slide.id === selectedSlideId)
  const displayConnectedUsers = socketConnectedUsers.length > 0 ? socketConnectedUsers : presentation.connectedUsers || []

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{presentation.title}</h1>
            <p className="text-sm text-gray-600">
              Created by {presentation.createdBy} • {presentation.slides?.length || 0} slides
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {/* Markdown Toggle */}
            {userRole !== 'Viewer' && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Markdown:</label>
                <button
                  onClick={() => setUseMarkdown(!useMarkdown)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useMarkdown ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useMarkdown ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-xs text-gray-500">
                  {useMarkdown ? 'Rich text' : 'Plain text'}
                </span>
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              Role: <span className="font-medium">{userRole}</span>
            </div>
            <div className="text-sm text-gray-600">
              User: <span className="font-medium">{nickname}</span>
            </div>
            <button
              onClick={() => window.open(`/presentation/${presentationId}/present`, '_blank')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-10V7a3 3 0 01-3 3H6a3 3 0 01-3-3V4a3 3 0 013-3h8a3 3 0 013 3v3z" />
              </svg>
              <span>Present</span>
            </button>
            <UserAccessManager 
              presentation={presentation}
              currentUserNickname={nickname}
              onUserAdded={handleUserAdded}
              onUserRemoved={handleUserRemoved}
              onSettingsUpdated={handleSettingsUpdated}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Slides */}
        <SlidePanel
          slides={presentation.slides || []}
          selectedSlideId={selectedSlideId}
          onSlideSelect={handleSlideSelect}
          onAddSlide={handleAddSlide}
          onDeleteSlide={handleDeleteSlide}
          userRole={userRole}
          isCreator={isCreator}
        />

        {/* Center Panel - Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-white m-4 rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
            {currentSlide ? (
              <div 
                className="w-full h-full relative"
                style={{ backgroundColor: currentSlide.backgroundColor || '#ffffff' }}
                onContextMenu={(e) => {
                  if (userRole !== 'Viewer') {
                    e.preventDefault()
                    const rect = e.currentTarget.getBoundingClientRect()
                    const position = {
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top
                    }
                    setContextMenu({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      slidePosition: position
                    })
                  }
                }}
                onClick={() => {
                  // Hide context menu on click
                  setContextMenu({ visible: false, x: 0, y: 0, slidePosition: null })
                }}
              >
                {/* Slide Title */}
                <div className="absolute top-4 left-4 right-4">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {currentSlide.title}
                  </h2>
                </div>

                {/* Text Blocks */}
                {currentSlide.textBlocks?.map((block) => {
                  // Use MarkdownTextBlock for blocks with markdown support or when markdown is enabled
                  const shouldUseMarkdown = block.isMarkdown !== false && (block.isMarkdown || useMarkdown)
                  
                  return shouldUseMarkdown ? (
                    <MarkdownTextBlock
                      key={block.id}
                      block={block}
                      onUpdate={(updatedBlock) => handleTextBlockUpdate(currentSlide.id, updatedBlock)}
                      onDelete={() => handleTextBlockDelete(currentSlide.id, block.id)}
                      disabled={userRole === 'Viewer'}
                    />
                  ) : (
                    <TextBlock
                      key={block.id}
                      textBlock={block}
                      onUpdate={(updatedBlock) => handleTextBlockUpdate(currentSlide.id, updatedBlock)}
                      onDelete={() => handleTextBlockDelete(currentSlide.id, block.id)}
                      onSelect={() => {}} // Add empty function to prevent error
                      canEdit={userRole !== 'Viewer'}
                    />
                  )
                })}

                {/* Instructions */}
                {userRole !== 'Viewer' && (!currentSlide.textBlocks || currentSlide.textBlocks.length === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-gray-400 text-center">
                      <p className="text-lg mb-2">Right-click to add a text block</p>
                      <p className="text-sm">
                        {useMarkdown ? 'Markdown mode: Use **bold**, *italic*, ## headers, - lists' : 'Plain text mode'}
                      </p>
                      <p className="text-sm">Double-click text blocks to edit them</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Select a slide to start editing</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Users */}
        <div className="w-64 bg-gray-50 border-l border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Connected Users</h3>
          <div className="space-y-2">
            {displayConnectedUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                <div>
                  <div className="font-medium text-gray-800">{user.nickname}</div>
                  <div className="text-xs text-gray-500">{user.role}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
            )) || (
              <div className="text-gray-500 text-sm">No users connected</div>
            )}
          </div>
          
          {/* Connection Status */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              WebSocket: {isConnected ? 'Connected' : 'Disconnected'}
              <br />
              {displayConnectedUsers.length} user{displayConnectedUsers.length !== 1 ? 's' : ''} online
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.visible && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu({ visible: false, x: 0, y: 0, slidePosition: null })}
          />
          
          {/* Context Menu */}
          <div 
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              minWidth: '180px'
            }}
          >
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                if (contextMenu.slidePosition && currentSlide) {
                  handleTextBlockAdd(currentSlide.id, contextMenu.slidePosition)
                  setContextMenu({ visible: false, x: 0, y: 0, slidePosition: null })
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Text Block
            </button>
          </div>
        </>
      )}
    </div>
  )
}
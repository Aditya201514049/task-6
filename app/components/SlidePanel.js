'use client'

import { useState } from 'react'

export default function SlidePanel({ 
  slides = [], 
  selectedSlideId, 
  onSlideSelect, 
  onAddSlide, 
  onDeleteSlide,
  userRole, 
  isCreator,
  isMobile = false
}) {
  const [isAddingSlide, setIsAddingSlide] = useState(false)

  const handleAddSlide = async () => {
    if (!isCreator || isAddingSlide) return
    
    setIsAddingSlide(true)
    try {
      await onAddSlide()
    } finally {
      setIsAddingSlide(false)
    }
  }

  const handleDeleteSlide = async (e, slideId) => {
    e.stopPropagation() // Prevent slide selection when delete button is clicked
    
    if (slides.length <= 1) {
      alert('Cannot delete the last slide')
      return
    }
    
    const confirmed = window.confirm('Are you sure you want to delete this slide? This action cannot be undone.')
    if (!confirmed) return
    
    try {
      await onDeleteSlide(slideId)
    } catch (error) {
      console.error('Error deleting slide:', error)
      alert('Failed to delete slide: ' + error.message)
    }
  }

  return (
    <div className={`${
      isMobile 
        ? 'w-full bg-white' 
        : 'w-64 bg-gray-50 border-r border-gray-200'
    } flex flex-col`}>
      {/* Header */}
      <div className={`${isMobile ? 'p-3' : 'p-4'} border-b border-gray-200`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-800`}>
          Slides
        </h2>
        <p className="text-sm text-gray-600">{slides.length} slide{slides.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Slides List */}
      <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-2' : 'p-2'}`}>
        {isMobile ? (
          // Mobile: Horizontal scrolling grid
          <div className="flex space-x-3 pb-2 overflow-x-auto">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                onClick={() => onSlideSelect(slide.id)}
                className={`
                  flex-shrink-0 w-32 p-2 rounded-lg cursor-pointer transition-all duration-200 group
                  ${selectedSlideId === slide.id 
                    ? 'bg-blue-100 border-2 border-blue-500 shadow-md' 
                    : 'bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                {/* Mobile Slide Thumbnail */}
                <div className="aspect-video bg-white border border-gray-200 rounded mb-2 relative overflow-hidden">
                  {slide.textBlocks && slide.textBlocks.length > 0 ? (
                    <div className="p-1">
                      {slide.textBlocks.slice(0, 2).map((block, blockIndex) => (
                        <div
                          key={blockIndex}
                          className="text-xs text-gray-600 mb-1 truncate"
                          style={{
                            fontSize: '5px',
                            lineHeight: '6px'
                          }}
                        >
                          {block.content || 'Text block'}
                        </div>
                      ))}
                      {slide.textBlocks.length > 2 && (
                        <div className="text-xs text-gray-400" style={{ fontSize: '5px' }}>
                          +{slide.textBlocks.length - 2} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-xs">Empty</div>
                    </div>
                  )}
                  
                  {/* Slide number overlay */}
                  <div className="absolute top-1 left-1 bg-gray-800 text-white text-xs px-1 rounded">
                    {index + 1}
                  </div>
                  
                  {/* Delete button for mobile */}
                  {(userRole === 'creator' || userRole === 'editor') && (
                    <button
                      onClick={(e) => handleDeleteSlide(e, slide.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-opacity flex items-center justify-center"
                      title="Delete slide"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Mobile Slide Title */}
                <div className="text-xs font-medium text-gray-800 truncate text-center">
                  {slide.title || `Slide ${index + 1}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Desktop: Vertical list
          slides.map((slide, index) => (
            <div
              key={slide.id}
              onClick={() => onSlideSelect(slide.id)}
              className={`
                mb-2 p-3 rounded-lg cursor-pointer transition-all duration-200 group
                ${selectedSlideId === slide.id 
                  ? 'bg-blue-100 border-2 border-blue-500 shadow-md' 
                  : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
              `}
            >
              {/* Desktop Slide Thumbnail */}
              <div className="aspect-video bg-white border border-gray-200 rounded mb-2 relative overflow-hidden">
                {slide.textBlocks && slide.textBlocks.length > 0 ? (
                  <div className="p-1">
                    {slide.textBlocks.slice(0, 3).map((block, blockIndex) => (
                      <div
                        key={blockIndex}
                        className="text-xs text-gray-600 mb-1 truncate"
                        style={{
                          fontSize: '6px',
                          lineHeight: '8px'
                        }}
                      >
                        {block.content || 'Text block'}
                      </div>
                    ))}
                    {slide.textBlocks.length > 3 && (
                      <div className="text-xs text-gray-400" style={{ fontSize: '6px' }}>
                        +{slide.textBlocks.length - 3} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-xs">Empty slide</div>
                  </div>
                )}
                
                {/* Slide number overlay */}
                <div className="absolute top-1 left-1 bg-gray-800 text-white text-xs px-1 rounded">
                  {index + 1}
                </div>
                
                {/* Delete button */}
                {(userRole === 'creator' || userRole === 'editor') && (
                  <button
                    onClick={(e) => handleDeleteSlide(e, slide.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Delete slide"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Desktop Slide Title */}
              <div className="text-sm font-medium text-gray-800 truncate">
                {slide.title || `Slide ${index + 1}`}
              </div>
              
              {/* Desktop Slide Info */}
              <div className="text-xs text-gray-500 mt-1">
                {slide.textBlocks?.length || 0} text block{(slide.textBlocks?.length || 0) !== 1 ? 's' : ''}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Slide Button */}
      {isCreator && (
        <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200`}>
          <button
            onClick={handleAddSlide}
            disabled={isAddingSlide}
            className={`
              w-full py-2 px-4 rounded-lg font-medium transition-all duration-200
              ${isAddingSlide
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
              }
            `}
          >
            {isAddingSlide ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                Adding...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Slide
              </div>
            )}
          </button>
        </div>
      )}

      {/* Role indicator for non-creators */}
      {!isCreator && userRole !== 'editor' && !isMobile && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Role: {userRole}
            <br />
            {userRole === 'viewer' ? 'View only' : 'Can edit slides'}
          </div>
        </div>
      )}
    </div>
  )
}
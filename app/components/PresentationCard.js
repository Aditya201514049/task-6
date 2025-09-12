export default function PresentationCard({ presentation, onJoin, onDelete, isCreator }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group relative">
      {/* Delete button for creators */}
      {isCreator && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
          title="Delete presentation"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      )}

      {/* Thumbnail Area */}
      <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-lg p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v10.586l-2-2V4H8v8.586l-2 2V4a1 1 0 011-1z" />
            </svg>
          </div>
          <div className="text-xs text-gray-500">
            {presentation.totalSlides || 1} slide{(presentation.totalSlides || 1) !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors flex-1">
            {presentation.title}
          </h3>
          {isCreator && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              Owner
            </span>
          )}
        </div>
        
        {presentation.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {presentation.description}
          </p>
        )}

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Created by {presentation.createdBy}
          </div>
          
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDate(presentation.createdAt)} at {formatTime(presentation.createdAt)}
          </div>

          {presentation.onlineUsers > 0 && (
            <div className="flex items-center text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              {presentation.onlineUsers} user{presentation.onlineUsers !== 1 ? 's' : ''} online
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={onJoin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
        >
          {isCreator ? 'Open Presentation' : 'Join Presentation'}
        </button>
      </div>
    </div>
  )
}
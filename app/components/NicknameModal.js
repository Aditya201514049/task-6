'use client'

import { useState } from 'react'

export default function NicknameModal({ onSubmit, onClose }) {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const trimmedNickname = nickname.trim()
    
    if (!trimmedNickname) {
      setError('Please enter a nickname')
      return
    }
    
    if (trimmedNickname.length < 2) {
      setError('Nickname must be at least 2 characters')
      return
    }
    
    if (trimmedNickname.length > 20) {
      setError('Nickname must be less than 20 characters')
      return
    }
    
    onSubmit(trimmedNickname)
  }

  const handleInputChange = (e) => {
    setNickname(e.target.value)
    if (error) setError('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Enter Your Nickname
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          Choose a nickname to identify yourself in presentations. No registration required!
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              Nickname
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={handleInputChange}
              placeholder="Enter your nickname..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
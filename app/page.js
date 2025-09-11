'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PresentationCard from './components/PresentationCard'
import NicknameModal from './components/NicknameModal'
import CreatePresentationModal from './components/CreatePresentationModal'

export default function Home() {
  const [presentations, setPresentations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNicknameModal, setShowNicknameModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [nickname, setNickname] = useState('')
  const [actionType, setActionType] = useState('') // 'create' or 'join'
  const [selectedPresentationId, setSelectedPresentationId] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check if user has a nickname stored
    const storedNickname = localStorage.getItem('userNickname')
    if (storedNickname) {
      setNickname(storedNickname)
    }
    
    fetchPresentations()
  }, [])

  const fetchPresentations = async () => {
    try {
      const response = await fetch('/api/presentations')
      const data = await response.json()
      if (data.success) {
        setPresentations(data.presentations)
      }
    } catch (error) {
      console.error('Error fetching presentations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePresentation = () => {
    if (!nickname) {
      setActionType('create')
      setShowNicknameModal(true)
    } else {
      setShowCreateModal(true)
    }
  }

  const handleJoinPresentation = (presentationId) => {
    if (!nickname) {
      setActionType('join')
      setSelectedPresentationId(presentationId)
      setShowNicknameModal(true)
    } else {
      joinPresentation(presentationId)
    }
  }

  const createNewPresentation = async (presentationData) => {
    try {
      const response = await fetch('/api/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: presentationData.title,
          description: presentationData.description,
          createdBy: nickname
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setShowCreateModal(false)
        router.push(`/presentation/${data.presentation.id}`)
      } else {
        throw new Error(data.error || 'Failed to create presentation')
      }
    } catch (error) {
      console.error('Error creating presentation:', error)
      throw error
    }
  }

  const joinPresentation = (presentationId) => {
    router.push(`/presentation/${presentationId}`)
  }

  const handleNicknameSubmit = (submittedNickname) => {
    setNickname(submittedNickname)
    localStorage.setItem('userNickname', submittedNickname)
    setShowNicknameModal(false)
    
    if (actionType === 'create') {
      setShowCreateModal(true)
    } else if (actionType === 'join') {
      joinPresentation(selectedPresentationId)
    }
  }

  const handleLogout = () => {
    setNickname('')
    localStorage.removeItem('userNickname')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading presentations...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Collaborative Presentations
            </h1>
            <div className="flex items-center gap-4">
              {nickname && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    Welcome, <span className="font-medium">{nickname}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-700 underline"
                  >
                    Logout
                  </button>
                </div>
              )}
              <button
                onClick={handleCreatePresentation}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Create New Presentation
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {presentations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              No presentations yet. Create the first one!
            </div>
            <button
              onClick={handleCreatePresentation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Create First Presentation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {presentations.map((presentation) => (
              <PresentationCard
                key={presentation.id}
                presentation={presentation}
                onJoin={() => handleJoinPresentation(presentation.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Nickname Modal */}
      {showNicknameModal && (
        <NicknameModal
          onSubmit={handleNicknameSubmit}
          onClose={() => setShowNicknameModal(false)}
        />
      )}

      {/* Create Presentation Modal */}
      {showCreateModal && (
        <CreatePresentationModal
          onSubmit={createNewPresentation}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}

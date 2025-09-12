  'use client'

import { useState } from 'react'

export default function UserAccessManager({ 
  presentation, 
  currentUserNickname, 
  onUserAdded, 
  onUserRemoved, 
  onSettingsUpdated 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [newUserNickname, setNewUserNickname] = useState('')
  const [newUserRole, setNewUserRole] = useState('editor')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState('')

  const isCreator = presentation?.createdBy === currentUserNickname

  if (!isCreator) {
    return null // Only show to creators
  }

  // Generate invite link
  const generateInviteLink = (role = 'editor') => {
    const baseUrl = window.location.origin
    const inviteToken = btoa(`${presentation.id}:${role}:${Date.now()}`)
    return `${baseUrl}/presentation/${presentation.id}?invite=${inviteToken}&role=${role}`
  }

  const copyInviteLink = async (role) => {
    try {
      const link = generateInviteLink(role)
      await navigator.clipboard.writeText(link)
      setCopySuccess(`${role.charAt(0).toUpperCase() + role.slice(1)} invite link copied!`)
      setTimeout(() => setCopySuccess(''), 3000)
    } catch (err) {
      console.error('Failed to copy link:', err)
      setCopySuccess('Failed to copy link')
      setTimeout(() => setCopySuccess(''), 3000)
    }
  }

  const handleAddUser = async () => {
    if (!newUserNickname.trim()) {
      setError('Please enter a nickname')
      return
    }

    if (newUserNickname === currentUserNickname) {
      setError('Cannot add yourself')
      return
    }

    // Check if user already has access
    const existingUser = presentation.authorizedUsers?.find(
      user => user.nickname === newUserNickname
    )
    if (existingUser) {
      setError('User already has access')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/presentations/${presentation.id}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: newUserNickname,
          role: newUserRole,
          addedBy: currentUserNickname
        }),
      })

      const data = await response.json()

      if (data.success) {
        onUserAdded(data.authorizedUser)
        setNewUserNickname('')
        setNewUserRole('editor')
        setError('')
      } else {
        setError(data.error || 'Failed to add user')
      }
    } catch (err) {
      console.error('Error adding user:', err)
      setError('Failed to add user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveUser = async (nickname) => {
    if (!confirm(`Remove access for ${nickname}?`)) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/presentations/${presentation.id}/users/${nickname}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          removedBy: currentUserNickname
        }),
      })

      const data = await response.json()

      if (data.success) {
        onUserRemoved(nickname)
      } else {
        setError(data.error || 'Failed to remove user')
      }
    } catch (err) {
      console.error('Error removing user:', err)
      setError('Failed to remove user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettingsUpdate = async (newSettings) => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/presentations/${presentation.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: newSettings,
          updatedBy: currentUserNickname
        }),
      })

      const data = await response.json()

      if (data.success) {
        onSettingsUpdated(data.settings)
      } else {
        setError(data.error || 'Failed to update settings')
      }
    } catch (err) {
      console.error('Error updating settings:', err)
      setError('Failed to update settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Access Manager Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        title="Manage User Access"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        Manage Access
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-800">Manage User Access</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                  {error}
                </div>
              )}

              {/* Add New User */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Add User</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newUserNickname}
                    onChange={(e) => setNewUserNickname(e.target.value)}
                    placeholder="Enter nickname"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={handleAddUser}
                    disabled={isLoading || !newUserNickname.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>

              {/* Current Users */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Current Users</h3>
                <div className="space-y-2">
                  {/* Creator */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {presentation.createdBy.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{presentation.createdBy}</div>
                        <div className="text-sm text-gray-500">Creator</div>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Owner
                    </span>
                  </div>

                  {/* Authorized Users */}
                  {presentation.authorizedUsers?.map((user) => (
                    <div key={user.nickname} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {user.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{user.nickname}</div>
                          <div className="text-sm text-gray-500">
                            Added by {user.addedBy} • {new Date(user.addedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'editor' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                        <button
                          onClick={() => handleRemoveUser(user.nickname)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Remove access"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {(!presentation.authorizedUsers || presentation.authorizedUsers.length === 0) && (
                    <div className="text-center text-gray-500 py-4">
                      No additional users have been granted access
                    </div>
                  )}
                </div>
              </div>

              {/* Presentation Settings */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Presentation Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={presentation.settings?.isPublic || false}
                      onChange={(e) => handleSettingsUpdate({
                        ...presentation.settings,
                        isPublic: e.target.checked
                      })}
                      disabled={isLoading}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-800">Public Access</div>
                      <div className="text-sm text-gray-500">Anyone can view this presentation</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={presentation.settings?.allowAnonymousEdit || false}
                      onChange={(e) => handleSettingsUpdate({
                        ...presentation.settings,
                        allowAnonymousEdit: e.target.checked
                      })}
                      disabled={isLoading || !presentation.settings?.isPublic}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                    />
                    <div>
                      <div className="font-medium text-gray-800">Allow Anonymous Editing</div>
                      <div className="text-sm text-gray-500">Public users can edit (requires Public Access)</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

export default function useSocket(presentationId, nickname) {
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!presentationId || !nickname) return

    // Initialize socket connection
    socketRef.current = io('/', {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    })

    const socket = socketRef.current

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      setIsConnected(true)
      setError(null)
      
      // Join the presentation room
      socket.emit('join-presentation', {
        presentationId,
        nickname,
        socketId: socket.id
      })
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      setIsConnected(false)
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socket.connect()
      }
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setError('Connection failed')
      setIsConnected(false)
    })

    // Presentation-specific event handlers
    socket.on('user-joined', (data) => {
      console.log('User joined:', data)
      setConnectedUsers(data.connectedUsers || [])
    })

    socket.on('user-left', (data) => {
      console.log('User left:', data)
      setConnectedUsers(data.connectedUsers || [])
    })

    socket.on('users-updated', (data) => {
      setConnectedUsers(data.connectedUsers || [])
    })

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.emit('leave-presentation', {
          presentationId,
          nickname
        })
        socket.disconnect()
      }
    }
  }, [presentationId, nickname])

  // Emit text block update
  const emitTextBlockUpdate = (slideId, blockId, updates) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('text-block-update', {
        presentationId,
        slideId,
        blockId,
        updates,
        updatedBy: nickname
      })
    }
  }

  // Emit text block add
  const emitTextBlockAdd = (slideId, textBlock) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('text-block-add', {
        presentationId,
        slideId,
        textBlock,
        addedBy: nickname
      })
    }
  }

  // Emit text block delete
  const emitTextBlockDelete = (slideId, blockId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('text-block-delete', {
        presentationId,
        slideId,
        blockId,
        deletedBy: nickname
      })
    }
  }

  // Emit slide add
  const emitSlideAdd = (slide) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('slide-add', {
        presentationId,
        slide,
        addedBy: nickname
      })
    }
  }

  // Emit cursor position
  const emitCursorPosition = (x, y, slideId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('cursor-position', {
        presentationId,
        slideId,
        x,
        y,
        nickname
      })
    }
  }

  // Subscribe to real-time updates
  const onTextBlockUpdate = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('text-block-updated', callback)
      return () => socketRef.current.off('text-block-updated', callback)
    }
  }

  const onTextBlockAdd = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('text-block-added', callback)
      return () => socketRef.current.off('text-block-added', callback)
    }
  }

  const onTextBlockDelete = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('text-block-deleted', callback)
      return () => socketRef.current.off('text-block-deleted', callback)
    }
  }

  const onSlideAdd = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('slide-added', callback)
      return () => socketRef.current.off('slide-added', callback)
    }
  }

  const onCursorMove = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('cursor-moved', callback)
      return () => socketRef.current.off('cursor-moved', callback)
    }
  }

  const onPresentationUpdate = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('presentation-updated', callback)
      return () => socketRef.current.off('presentation-updated', callback)
    }
  }

  return {
    socket: socketRef.current,
    isConnected,
    connectedUsers,
    error,
    // Emit functions
    emitTextBlockUpdate,
    emitTextBlockAdd,
    emitTextBlockDelete,
    emitSlideAdd,
    emitCursorPosition,
    // Subscribe functions
    onTextBlockUpdate,
    onTextBlockAdd,
    onTextBlockDelete,
    onSlideAdd,
    onCursorMove,
    onPresentationUpdate
  }
}
const express = require('express')
const next = require('next')
const { Server } = require('socket.io')
const { createServer } = require('http')
const mongoose = require('mongoose')

const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev, turbo: dev })
const nextHandler = nextApp.getRequestHandler()

const presentationRoutes = require('./routes/presentations')
console.log('Presentation routes loaded successfully')

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/presentations')
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

nextApp.prepare().then(() => {
  const app = express()
  
  // Middleware
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use('/api/presentations', presentationRoutes)
  console.log('Presentation routes mounted at /api/presentations')

  // API Routes (you'll add these later)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running!', time: new Date() })
  })

  // Let Next.js handle all other routes (your React pages)
  app.all(/^(?!\/api).*$/, (req, res) => {
    return nextHandler(req, res)
  })

  // Create HTTP server and Socket.io
  const server = createServer(app)
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  })

  // Socket.io connection handling
  const presentationUsers = new Map() // Track users per presentation
  
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Join presentation room
    socket.on('join-presentation', (data) => {
      const { presentationId, nickname, role = 'Viewer' } = data
      socket.join(presentationId)
      
      // Store user info in socket
      socket.presentationId = presentationId
      socket.nickname = nickname
      
      // Add user to presentation users map
      if (!presentationUsers.has(presentationId)) {
        presentationUsers.set(presentationId, new Map())
      }
      
      const presentationUserMap = presentationUsers.get(presentationId)
      presentationUserMap.set(socket.id, {
        nickname,
        socketId: socket.id,
        role: role, // Use the role from client
        joinedAt: new Date()
      })
      
      // Get current connected users for this presentation
      const connectedUsers = Array.from(presentationUserMap.values())
      
      console.log(`User ${nickname} (${socket.id}) joined presentation: ${presentationId} as ${role}`)
      console.log(`Connected users in ${presentationId}:`, connectedUsers.map(u => `${u.nickname} (${u.role})`))
      
      // Emit to all users in the presentation (including the one who just joined)
      io.to(presentationId).emit('user-joined', {
        user: { nickname, socketId: socket.id, role },
        connectedUsers
      })
    })

    // Handle user role updates
    socket.on('update-user-role', (data) => {
      const { presentationId, nickname, role } = data
      
      if (presentationUsers.has(presentationId)) {
        const presentationUserMap = presentationUsers.get(presentationId)
        const userEntry = Array.from(presentationUserMap.values()).find(u => u.nickname === nickname)
        
        if (userEntry) {
          userEntry.role = role
          const connectedUsers = Array.from(presentationUserMap.values())
          
          // Emit updated users list
          io.to(presentationId).emit('users-updated', {
            connectedUsers
          })
        }
      }
    })

    // Leave presentation room
    socket.on('leave-presentation', (data) => {
      const { presentationId, nickname } = data
      handleUserLeave(socket, presentationId, nickname)
    })

    // Handle real-time text updates
    socket.on('text-update', (data) => {
      socket.to(data.presentationId).emit('text-update', data)
    })

    // Handle text block updates
    socket.on('text-block-update', (data) => {
      socket.to(data.presentationId).emit('text-block-updated', data)
    })

    // Handle text block add
    socket.on('text-block-add', (data) => {
      socket.to(data.presentationId).emit('text-block-added', data)
    })

    // Handle text block delete
    socket.on('text-block-delete', (data) => {
      socket.to(data.presentationId).emit('text-block-deleted', data)
    })

    // Handle slide add
    socket.on('slide-add', (data) => {
      socket.to(data.presentationId).emit('slide-added', data)
    })

    // Handle slide delete
    socket.on('slide-delete', (data) => {
      socket.to(data.presentationId).emit('slide-deleted', data)
    })

    // Handle connection errors
    socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    // Handle user disconnection
    socket.on('disconnect', (reason) => {
      console.log('User disconnected:', socket.id, 'Reason:', reason)
      if (socket.presentationId) {
        handleUserLeave(socket, socket.presentationId, socket.nickname)
      }
    })
  })

  const handleUserLeave = (socket, presentationId, nickname) => {
    if (presentationUsers.has(presentationId)) {
      const presentationUserMap = presentationUsers.get(presentationId)
      presentationUserMap.delete(socket.id)
      
      // Get current connected users for this presentation
      const connectedUsers = Array.from(presentationUserMap.values())
      
      console.log(`User ${nickname} (${socket.id}) left presentation: ${presentationId}`)
      console.log(`Connected users in ${presentationId}:`, connectedUsers.map(u => u.nickname))
      
      // Emit to all users in the presentation
      io.to(presentationId).emit('user-left', {
        user: { nickname, socketId: socket.id },
        connectedUsers
      })
    }
  }

  // Connect to database and start server
  connectDB().then(() => {
    const PORT = process.env.PORT || 3000
    server.listen(PORT, (err) => {
      if (err) throw err
      console.log(`Server running on http://localhost:${PORT}`)
      console.log(`Socket.io ready for connections`)
    })
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  mongoose.connection.close()
  process.exit(0)
})
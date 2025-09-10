const express = require('express')
const next = require('next')
const { Server } = require('socket.io')
const { createServer } = require('http')
const mongoose = require('mongoose')

const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev, turbo: dev })
const nextHandler = nextApp.getRequestHandler()

const presentationRoutes = require('./routes/presentations')
console.log('✅ Presentation routes loaded successfully')

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/presentations')
    console.log('✅ MongoDB connected successfully')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

nextApp.prepare().then(() => {
  const app = express()
  
  // Middleware
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.use('/api/presentations', presentationRoutes)
  console.log('✅ Presentation routes mounted at /api/presentations')

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
      origin: false, // Same origin - no CORS needed
      methods: ['GET', 'POST']
    }
  })

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id)

    // Join presentation room
    socket.on('join-presentation', (presentationId) => {
      socket.join(presentationId)
      console.log(`👤 User ${socket.id} joined presentation: ${presentationId}`)
    })

    // Handle real-time text updates
    socket.on('text-update', (data) => {
      socket.to(data.presentationId).emit('text-update', data)
    })

    // Handle user disconnection
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id)
    })
  })

  // Connect to database and start server
  connectDB().then(() => {
    const PORT = process.env.PORT || 3000
    server.listen(PORT, (err) => {
      if (err) throw err
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📡 Socket.io ready for connections`)
    })
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully')
  mongoose.connection.close()
  process.exit(0)
})
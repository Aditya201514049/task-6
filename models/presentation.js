const mongoose = require('mongoose')

// Text Block Schema for individual text elements on slides
const textBlockSchema = new mongoose.Schema({
  id: { type: String, required: true },
  x: { type: Number, required: true, default: 100 },
  y: { type: Number, required: true, default: 100 },
  width: { type: Number, required: true, default: 200 },
  height: { type: Number, required: true, default: 50 },
  content: { type: String, default: '' },
  fontSize: { type: Number, default: 16 },
  fontWeight: { type: String, default: 'normal' },
  color: { type: String, default: '#000000' },
  backgroundColor: { type: String, default: 'transparent' },
  textAlign: { type: String, default: 'left' },
  zIndex: { type: Number, default: 1 }
})

// Slide Schema
const slideSchema = new mongoose.Schema({
  id: { type: String, required: true },
  order: { type: Number, required: true },
  title: { type: String, default: 'Untitled Slide' },
  backgroundColor: { type: String, default: '#ffffff' },
  textBlocks: [textBlockSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// User Schema for tracking connected users
const userSchema = new mongoose.Schema({
  socketId: { type: String, required: true },
  nickname: { type: String, required: true },
  role: { type: String, enum: ['creator', 'editor', 'viewer'], default: 'viewer' },
  isOnline: { type: Boolean, default: true },
  cursor: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    slideId: { type: String, default: null }
  },
  joinedAt: { type: Date, default: Date.now }
})

// Authorized User Schema for persistent access control
const authorizedUserSchema = new mongoose.Schema({
  nickname: { type: String, required: true },
  role: { type: String, enum: ['editor', 'viewer'], required: true },
  addedBy: { type: String, required: true },
  addedAt: { type: Date, default: Date.now }
})

// Main Presentation Schema
const presentationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true, default: 'Untitled Presentation' },
  description: { type: String, default: '' },
  createdBy: { type: String, required: true }, // nickname of creator
  slides: [slideSchema],
  connectedUsers: [userSchema],
  authorizedUsers: [authorizedUserSchema], // Persistent user access control
  settings: {
    allowAnonymousEdit: { type: Boolean, default: true },
    maxUsers: { type: Number, default: 50 },
    isPublic: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now }
})

// Add indexes for better performance
presentationSchema.index({ id: 1 })
presentationSchema.index({ createdAt: -1 })
presentationSchema.index({ lastActivity: -1 })

// Update timestamps on save
presentationSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  this.lastActivity = new Date()
  next()
})

// Methods for presentation management
presentationSchema.methods.addSlide = function() {
  const slideId = `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const newSlide = {
    id: slideId,
    order: this.slides.length,
    title: `Slide ${this.slides.length + 1}`,
    textBlocks: []
  }
  this.slides.push(newSlide)
  return newSlide
}

presentationSchema.methods.addUser = function(socketId, nickname, role = 'viewer') {
  // Remove existing user with same socketId
  this.connectedUsers = this.connectedUsers.filter(user => user.socketId !== socketId)
  
  // Add new user
  this.connectedUsers.push({
    socketId,
    nickname,
    role,
    isOnline: true
  })
  
  return this.connectedUsers[this.connectedUsers.length - 1]
}

presentationSchema.methods.removeUser = function(socketId) {
  this.connectedUsers = this.connectedUsers.filter(user => user.socketId !== socketId)
}

presentationSchema.methods.updateUserRole = function(socketId, newRole) {
  const user = this.connectedUsers.find(user => user.socketId === socketId)
  if (user) {
    user.role = newRole
  }
  return user
}

// Methods for authorized user management
presentationSchema.methods.addAuthorizedUser = function(nickname, role, addedBy) {
  // Check if user already exists
  const existingUser = this.authorizedUsers.find(user => user.nickname === nickname)
  if (existingUser) {
    return null // User already exists
  }
  
  const newUser = {
    nickname,
    role,
    addedBy,
    addedAt: new Date()
  }
  
  this.authorizedUsers.push(newUser)
  return newUser
}

presentationSchema.methods.removeAuthorizedUser = function(nickname) {
  const initialLength = this.authorizedUsers.length
  this.authorizedUsers = this.authorizedUsers.filter(user => user.nickname !== nickname)
  return this.authorizedUsers.length < initialLength // Returns true if user was removed
}

presentationSchema.methods.getUserRole = function(nickname) {
  // Check if user is creator
  if (this.createdBy === nickname) {
    return 'creator'
  }
  
  // Check authorized users
  const authorizedUser = this.authorizedUsers.find(user => user.nickname === nickname)
  if (authorizedUser) {
    return authorizedUser.role
  }
  
  // Check if presentation allows anonymous access
  if (this.settings.isPublic) {
    return this.settings.allowAnonymousEdit ? 'editor' : 'viewer'
  }
  
  return null // No access
}

presentationSchema.methods.hasAccess = function(nickname) {
  return this.getUserRole(nickname) !== null
}

module.exports = mongoose.model('Presentation', presentationSchema)
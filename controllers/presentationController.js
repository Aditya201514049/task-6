const Presentation = require('../models/presentation')

// Generate unique presentation ID
const generatePresentationId = () => {
  return `pres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Generate unique slide ID
const generateSlideId = () => {
  return `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const presentationController = {
  // Get all presentations
  getAllPresentations: async (req, res) => {
    try {
      const presentations = await Presentation.find()
        .sort({ lastActivity: -1 })
        .limit(50)
        .select('id title createdBy createdAt lastActivity connectedUsers slides')
      
      // Add online user count to each presentation
      const presentationsWithUserCount = presentations.map(pres => ({
        ...pres.toObject(),
        onlineUsers: pres.connectedUsers.filter(user => user.isOnline).length,
        totalSlides: pres.slides?.length || 0
      }))
      
      res.json({ 
        success: true, 
        presentations: presentationsWithUserCount,
        total: presentations.length 
      })
    } catch (error) {
      console.error('Error fetching presentations:', error)
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch presentations' 
      })
    }
  },

  // Create new presentation
  createPresentation: async (req, res) => {
    try {
      const { title, createdBy, description } = req.body
      
      if (!createdBy || createdBy.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          error: 'Creator nickname is required' 
        })
      }
      
      const presentationId = generatePresentationId()
      const firstSlideId = generateSlideId()
      
      const presentation = new Presentation({
        id: presentationId,
        title: title?.trim() || 'Untitled Presentation',
        description: description?.trim() || '',
        createdBy: createdBy.trim(),
        slides: [{
          id: firstSlideId,
          order: 0,
          title: 'Slide 1',
          textBlocks: [],
          backgroundColor: '#ffffff'
        }]
      })
      
      await presentation.save()
      
      res.status(201).json({ 
        success: true, 
        presentation: {
          id: presentation.id,
          title: presentation.title,
          createdBy: presentation.createdBy,
          description: presentation.description,
          createdAt: presentation.createdAt
        },
        message: 'Presentation created successfully'
      })
    } catch (error) {
      console.error('Error creating presentation:', error)
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create presentation' 
      })
    }
  },

  // Get specific presentation by ID
  getPresentationById: async (req, res) => {
    try {
      const { id } = req.params
      
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Presentation ID is required' 
        })
      }
      
      const presentation = await Presentation.findOne({ id })
      
      if (!presentation) {
        return res.status(404).json({ 
          success: false, 
          error: 'Presentation not found' 
        })
      }
      
      // Update last activity
      presentation.lastActivity = new Date()
      await presentation.save()
      
      res.json({ 
        success: true, 
        presentation 
      })
    } catch (error) {
      console.error('Error fetching presentation:', error)
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch presentation' 
      })
    }
  },

  // Update presentation
  updatePresentation: async (req, res) => {
    try {
      const { id } = req.params
      const updates = req.body
      
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Presentation ID is required' 
        })
      }
      
      // Remove fields that shouldn't be updated directly
      delete updates.id
      delete updates.createdBy
      delete updates.createdAt
      
      const presentation = await Presentation.findOneAndUpdate(
        { id },
        { 
          ...updates, 
          updatedAt: new Date(), 
          lastActivity: new Date() 
        },
        { new: true, runValidators: true }
      )
      
      if (!presentation) {
        return res.status(404).json({ 
          success: false, 
          error: 'Presentation not found' 
        })
      }
      
      res.json({ 
        success: true, 
        presentation,
        message: 'Presentation updated successfully'
      })
    } catch (error) {
      console.error('Error updating presentation:', error)
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update presentation' 
      })
    }
  },

  // Delete presentation (only creator can delete)
  deletePresentation: async (req, res) => {
    try {
      const { id } = req.params
      const { createdBy } = req.body
      
      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Presentation ID is required' 
        })
      }
      
      if (!createdBy) {
        return res.status(400).json({ 
          success: false, 
          error: 'Creator nickname is required for deletion' 
        })
      }
      
      const presentation = await Presentation.findOne({ id })
      
      if (!presentation) {
        return res.status(404).json({ 
          success: false, 
          error: 'Presentation not found' 
        })
      }
      
      // Only creator can delete
      if (presentation.createdBy !== createdBy.trim()) {
        return res.status(403).json({ 
          success: false, 
          error: 'Only the creator can delete this presentation' 
        })
      }
      
      await Presentation.deleteOne({ id })
      
      res.json({ 
        success: true, 
        message: 'Presentation deleted successfully' 
      })
    } catch (error) {
      console.error('Error deleting presentation:', error)
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete presentation' 
      })
    }
  },

  // Add new slide to presentation
  addSlide: async (req, res) => {
    try {
      const { id } = req.params
      const { createdBy, title } = req.body
      
      const presentation = await Presentation.findOne({ id })
      
      if (!presentation) {
        return res.status(404).json({ 
          success: false, 
          error: 'Presentation not found' 
        })
      }
      
      // Check if user is creator or has editor permissions
      const isCreator = presentation.createdBy === createdBy
      const authorizedUser = presentation.authorizedUsers?.find(user => user.nickname === createdBy)
      const isEditor = authorizedUser?.role === 'editor'
      
      if (!isCreator && !isEditor) {
        return res.status(403).json({ 
          success: false, 
          error: 'Only creators and editors can add slides' 
        })
      }
      
      const newSlide = {
        id: generateSlideId(),
        order: presentation.slides.length,
        title: title || `Slide ${presentation.slides.length + 1}`,
        textBlocks: [],
        backgroundColor: '#ffffff'
      }
      
      presentation.slides.push(newSlide)
      presentation.lastActivity = new Date()
      
      await presentation.save()
      
      res.status(201).json({ 
        success: true, 
        slide: newSlide,
        message: 'Slide added successfully'
      })
    } catch (error) {
      console.error('Error adding slide:', error)
      res.status(500).json({ 
        success: false, 
        error: 'Failed to add slide' 
      })
    }
  },

  // Delete slide from presentation
  deleteSlide: async (req, res) => {
    try {
      const { id, slideId } = req.params
      const { createdBy } = req.body
      
      const presentation = await Presentation.findOne({ id })
      
      if (!presentation) {
        return res.status(404).json({ 
          success: false, 
          error: 'Presentation not found' 
        })
      }
      
      // Check if user is creator or has editor permissions
      const isCreator = presentation.createdBy === createdBy
      const authorizedUser = presentation.authorizedUsers?.find(user => user.nickname === createdBy)
      const isEditor = authorizedUser?.role === 'editor'
      
      if (!isCreator && !isEditor) {
        return res.status(403).json({ 
          success: false, 
          error: 'Only creators and editors can delete slides' 
        })
      }

      // Prevent deleting the last slide
      if (presentation.slides.length <= 1) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete the last slide' 
        })
      }
      
      // Find and remove the slide
      const slideIndex = presentation.slides.findIndex(slide => slide.id === slideId)
      if (slideIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          error: 'Slide not found' 
        })
      }
      
      presentation.slides.splice(slideIndex, 1)
      presentation.lastActivity = new Date()
      
      await presentation.save()
      
      res.json({ 
        success: true, 
        message: 'Slide deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting slide:', error)
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete slide' 
      })
    }
  }
}

module.exports = presentationController
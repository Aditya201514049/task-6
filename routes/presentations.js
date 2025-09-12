const express = require('express')
const router = express.Router()
const presentationController = require('../controllers/presentationController')
const Presentation = require('../models/presentation')

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Presentation routes are working' })
})

// Database test endpoint
router.get('/db-test', async (req, res) => {
  try {
    const count = await Presentation.countDocuments()
    const presentations = await Presentation.find({}, { id: 1, title: 1 }).limit(5)
    res.json({ 
      success: true, 
      message: 'Database connection working',
      totalPresentations: count,
      samplePresentations: presentations
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Database error: ' + error.message 
    })
  }
})

// GET /api/presentations - Get all presentations
router.get('/', presentationController.getAllPresentations)

// POST /api/presentations - Create new presentation
router.post('/', presentationController.createPresentation)

// GET /api/presentations/:id - Get specific presentation
router.get('/:id', presentationController.getPresentationById)

// PUT /api/presentations/:id - Update presentation
router.put('/:id', presentationController.updatePresentation)

// DELETE /api/presentations/:id - Delete presentation
router.delete('/:id', presentationController.deletePresentation)

// POST /api/presentations/:id/slides - Add new slide
router.post('/:id/slides', presentationController.addSlide)

// DELETE /api/presentations/:id/slides/:slideId - Delete slide
router.delete('/:id/slides/:slideId', presentationController.deleteSlide)

// GET /api/presentations/:id/role - Get user role for presentation
router.get('/:id/role', presentationController.getUserRole)

// POST /api/presentations/:id/users - Add user to presentation
router.post('/:id/users', async (req, res) => {
  try {
    console.log('Adding user request:', { id: req.params.id, body: req.body })
    
    const { id } = req.params
    const { nickname, role, addedBy } = req.body

    console.log('Looking for presentation with ID:', id)
    const presentation = await Presentation.findOne({ id })
    console.log('Found presentation:', presentation ? 'Yes' : 'No')
    
    if (!presentation) {
      console.log('Available presentations in DB:')
      const allPresentations = await Presentation.find({}, { id: 1, title: 1 })
      console.log(allPresentations)
      return res.status(404).json({ success: false, error: 'Presentation not found' })
    }

    console.log('Calling addAuthorizedUser method...')
    // Use the schema method to add user
    const newUser = presentation.addAuthorizedUser(nickname, role, addedBy)
    console.log('addAuthorizedUser result:', newUser)
    
    if (!newUser) {
      return res.status(400).json({ success: false, error: 'User already has access' })
    }

    console.log('Saving presentation...')
    await presentation.save()
    console.log('Presentation saved successfully')
    
    res.json({ success: true, authorizedUser: newUser })
  } catch (error) {
    console.error('Detailed error adding user:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ success: false, error: 'Internal server error: ' + error.message })
  }
})

// DELETE /api/presentations/:id/users/:nickname - Remove user from presentation
router.delete('/:id/users/:nickname', async (req, res) => {
  try {
    const { id, nickname } = req.params

    const presentation = await Presentation.findOne({ id })
    if (!presentation) {
      return res.status(404).json({ success: false, error: 'Presentation not found' })
    }

    // Use the schema method to remove user
    const removed = presentation.removeAuthorizedUser(nickname)
    if (!removed) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    await presentation.save()
    res.json({ success: true })
  } catch (error) {
    console.error('Error removing user:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

// PUT /api/presentations/:id/settings - Update presentation settings
router.put('/:id/settings', async (req, res) => {
  try {
    const { id } = req.params
    const { settings } = req.body

    const presentation = await Presentation.findOne({ id })
    if (!presentation) {
      return res.status(404).json({ success: false, error: 'Presentation not found' })
    }

    // Update settings
    presentation.settings = { ...presentation.settings, ...settings }
    await presentation.save()

    res.json({ success: true, settings: presentation.settings })
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
})

module.exports = router
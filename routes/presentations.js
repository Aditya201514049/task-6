const express = require('express')
const router = express.Router()
const presentationController = require('../controllers/presentationController')

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

module.exports = router
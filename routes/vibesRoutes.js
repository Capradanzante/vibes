const express = require('express');
const router = express.Router();
const vibesController = require('../controllers/vibesController');

// Rotta per ottenere tutte le vibes
router.get('/', vibesController.getAllVibes);

// Rotta per ottenere contenuti basati su una vibe specifica
router.get('/:vibeId/content', vibesController.getContentByVibe);

module.exports = router; 
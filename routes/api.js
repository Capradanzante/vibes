const express = require('express');
const router = express.Router();
const vibesController = require('../controllers/vibesController');
const songsController = require('../controllers/songsController');
const contentController = require('../controllers/contentController');
const searchController = require('../controllers/searchController');

// Vibes routes
router.get('/vibes', vibesController.getAll);
router.get('/vibes/popular', vibesController.getPopular);
router.get('/vibes/:id', vibesController.getById);

// Songs routes
router.get('/songs', songsController.getAll);
router.get('/songs/recent', songsController.getRecent);
router.get('/songs/:id', songsController.getById);
router.get('/songs/by-vibe/:vibeId', songsController.getByVibe);

// Content routes
router.get('/content', contentController.getAll);
router.get('/content/recent', contentController.getRecent);
router.get('/content/:id', contentController.getById);
router.get('/content/by-vibe/:vibeId', contentController.getByVibe);

// Search route
router.get('/search', searchController.search);

module.exports = router; 
const express = require('express');
const router = express.Router();
const spotifyController = require('../controllers/spotifyController');

// Rotte per l'autenticazione Spotify
router.get('/auth', spotifyController.getAuthUrl);
router.get('/callback', spotifyController.handleCallback);

// Rotta per la ricerca di brani
router.get('/search', spotifyController.searchTracks);

module.exports = router; 
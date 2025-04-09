const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Import controllers
const authController = require('../controllers/authController');
const contentController = require('../controllers/contentController');
const songsController = require('../controllers/songsController');
const vibesController = require('../controllers/vibesController');
const spotifyController = require('../controllers/spotifyController');

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);

// Content routes
router.get('/content', contentController.getAllContent);
router.get('/content/search', contentController.searchContent);
router.get('/content/vibe/:vibeId', contentController.getContentByVibe);
router.get('/content/:id', contentController.getContentById);
router.post('/content', auth, contentController.createContent);
router.put('/content/:id', auth, contentController.updateContent);
router.delete('/content/:id', auth, contentController.deleteContent);

// Song routes
router.get('/songs', songsController.getAllSongs);
router.get('/songs/search', songsController.searchSongs);
router.get('/songs/vibe/:vibeId', songsController.getSongsByVibe);
router.get('/songs/:id', songsController.getSongById);
router.post('/songs', auth, songsController.createSong);
router.put('/songs/:id', auth, songsController.updateSong);
router.delete('/songs/:id', auth, songsController.deleteSong);

// Spotify routes
router.get('/spotify/search', spotifyController.searchSpotify);
router.get('/spotify/token', spotifyController.getSpotifyToken);
router.get('/spotify/track/:id', spotifyController.getSpotifyTrack);
router.get('/spotify/artist/:id', spotifyController.getSpotifyArtist);
router.get('/spotify/album/:id', spotifyController.getSpotifyAlbum);

// Vibe routes
router.get('/vibes', vibesController.getAllVibes);
router.get('/vibes/popular', vibesController.getPopularVibes);
router.get('/vibes/:id', vibesController.getVibeById);
router.post('/vibes', auth, vibesController.createVibe);
router.put('/vibes/:id', auth, vibesController.updateVibe);
router.delete('/vibes/:id', auth, vibesController.deleteVibe);

module.exports = router; 
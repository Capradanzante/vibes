const songService = require('../services/songService');

const spotifyController = {
  searchSpotify: async (req, res) => {
    try {
      const { q: query, limit } = req.query;
      const songs = await songService.searchSpotify(query, limit);
      res.json({ success: true, data: songs });
    } catch (error) {
      console.error('Error searching Spotify:', error);
      res.status(500).json({ success: false, error: 'Errore durante la ricerca su Spotify' });
    }
  },

  getSpotifyToken: async (req, res) => {
    try {
      const token = await songService._refreshSpotifyToken();
      res.json({ success: true, data: token });
    } catch (error) {
      console.error('Error getting Spotify token:', error);
      res.status(500).json({ success: false, error: 'Errore durante il recupero del token Spotify' });
    }
  },

  getSpotifyTrack: async (req, res) => {
    try {
      const { id } = req.params;
      const track = await songService.getSpotifyTrack(id);
      res.json({ success: true, data: track });
    } catch (error) {
      console.error('Error getting Spotify track:', error);
      res.status(500).json({ success: false, error: 'Errore durante il recupero della traccia Spotify' });
    }
  },

  getSpotifyArtist: async (req, res) => {
    try {
      const { id } = req.params;
      const artist = await songService.getSpotifyArtist(id);
      res.json({ success: true, data: artist });
    } catch (error) {
      console.error('Error getting Spotify artist:', error);
      res.status(500).json({ success: false, error: 'Errore durante il recupero dell\'artista Spotify' });
    }
  },

  getSpotifyAlbum: async (req, res) => {
    try {
      const { id } = req.params;
      const album = await songService.getSpotifyAlbum(id);
      res.json({ success: true, data: album });
    } catch (error) {
      console.error('Error getting Spotify album:', error);
      res.status(500).json({ success: false, error: 'Errore durante il recupero dell\'album Spotify' });
    }
  }
};

module.exports = spotifyController; 
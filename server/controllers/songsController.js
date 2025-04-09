const songService = require('../services/songService');

const songsController = {
  getAllSongs: async (req, res) => {
    try {
      const { limit, offset } = req.query;
      const songs = await songService.getAllSongs(limit, offset);
      res.json({ success: true, data: songs });
    } catch (error) {
      console.error('Error getting songs:', error);
      res.status(500).json({ success: false, error: 'Errore durante il recupero delle canzoni' });
    }
  },

  getSongById: async (req, res) => {
    try {
      const { id } = req.params;
      const song = await songService.getSongById(id);
      res.json({ success: true, data: song });
    } catch (error) {
      console.error('Error getting song:', error);
      res.status(500).json({ success: false, error: 'Errore durante il recupero della canzone' });
    }
  },

  createSong: async (req, res) => {
    try {
      const songData = req.body;
      const song = await songService.createSong(songData);
      res.status(201).json({ success: true, data: song });
    } catch (error) {
      console.error('Error creating song:', error);
      res.status(500).json({ success: false, error: 'Errore durante la creazione della canzone' });
    }
  },

  updateSong: async (req, res) => {
    try {
      const { id } = req.params;
      const songData = req.body;
      const song = await songService.updateSong(id, songData);
      res.json({ success: true, data: song });
    } catch (error) {
      console.error('Error updating song:', error);
      res.status(500).json({ success: false, error: 'Errore durante l\'aggiornamento della canzone' });
    }
  },

  deleteSong: async (req, res) => {
    try {
      const { id } = req.params;
      const song = await songService.deleteSong(id);
      res.json({ success: true, data: song });
    } catch (error) {
      console.error('Error deleting song:', error);
      res.status(500).json({ success: false, error: 'Errore durante l\'eliminazione della canzone' });
    }
  },

  searchSongs: async (req, res) => {
    try {
      const { q: query, limit } = req.query;
      const songs = await songService.searchSongs(query, limit);
      res.json({ success: true, data: songs });
    } catch (error) {
      console.error('Error searching songs:', error);
      res.status(500).json({ success: false, error: 'Errore durante la ricerca delle canzoni' });
    }
  },

  getSongsByVibe: async (req, res) => {
    try {
      const { vibeId } = req.params;
      const { limit } = req.query;
      const songs = await songService.getSongsByVibe(vibeId, limit);
      res.json({ success: true, data: songs });
    } catch (error) {
      console.error('Error getting songs by vibe:', error);
      res.status(500).json({ success: false, error: 'Errore durante il recupero delle canzoni per vibe' });
    }
  }
};

module.exports = songsController; 
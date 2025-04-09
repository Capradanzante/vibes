const vibeService = require('../services/vibeService');

const vibesController = {
  getAllVibes: async (req, res) => {
    try {
      const vibes = await vibeService.getAllVibes();
      res.json({ success: true, data: vibes });
    } catch (error) {
      console.error('Error getting vibes:', error);
      res.status(500).json({ success: false, error: 'Errore durante il recupero dei vibes' });
    }
  },

  getVibeById: async (req, res) => {
    try {
      const { id } = req.params;
      const vibe = await vibeService.getVibeById(id);
      res.json({ success: true, data: vibe });
    } catch (error) {
      console.error('Error getting vibe:', error);
      res.status(500).json({ success: false, error: 'Errore durante il recupero del vibe' });
    }
  },

  createVibe: async (req, res) => {
    try {
      const vibeData = req.body;
      const vibe = await vibeService.createVibe(vibeData);
      res.status(201).json({ success: true, data: vibe });
    } catch (error) {
      console.error('Error creating vibe:', error);
      res.status(500).json({ success: false, error: 'Errore durante la creazione del vibe' });
    }
  },

  updateVibe: async (req, res) => {
    try {
      const { id } = req.params;
      const vibeData = req.body;
      const vibe = await vibeService.updateVibe(id, vibeData);
      res.json({ success: true, data: vibe });
    } catch (error) {
      console.error('Error updating vibe:', error);
      res.status(500).json({ success: false, error: 'Errore durante l\'aggiornamento del vibe' });
    }
  },

  deleteVibe: async (req, res) => {
    try {
      const { id } = req.params;
      const vibe = await vibeService.deleteVibe(id);
      res.json({ success: true, data: vibe });
    } catch (error) {
      console.error('Error deleting vibe:', error);
      res.status(500).json({ success: false, error: 'Errore durante l\'eliminazione del vibe' });
    }
  },

  getPopularVibes: async (req, res) => {
    try {
      const { limit } = req.query;
      const vibes = await vibeService.getPopularVibes(limit);
      res.json({ success: true, data: vibes });
    } catch (error) {
      console.error('Error getting popular vibes:', error);
      res.status(500).json({ success: false, error: 'Errore durante il recupero dei vibes popolari' });
    }
  }
};

module.exports = vibesController; 
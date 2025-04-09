const db = require('../db');

const vibesController = {
  getAll: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM vibes ORDER BY name');
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting all vibes:', error);
      res.status(500).json({ success: false, error: 'Errore nel recupero delle vibes' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query('SELECT * FROM vibes WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Vibe non trovata' });
      }
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error getting vibe by id:', error);
      res.status(500).json({ success: false, error: 'Errore nel recupero della vibe' });
    }
  },

  getPopular: async (req, res) => {
    try {
      const { limit = 8 } = req.query;
      const result = await db.query(
        `SELECT v.*, COUNT(sv.song_id) as usage_count 
         FROM vibes v 
         LEFT JOIN song_vibes sv ON v.id = sv.vibe_id 
         GROUP BY v.id 
         ORDER BY usage_count DESC 
         LIMIT $1`,
        [limit]
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting popular vibes:', error);
      res.status(500).json({ success: false, error: 'Errore nel recupero delle vibes popolari' });
    }
  }
};

module.exports = vibesController; 
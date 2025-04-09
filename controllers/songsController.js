const db = require('../db');

const songsController = {
  getAll: async (req, res) => {
    try {
      const result = await db.query(`
        SELECT s.*, array_agg(json_build_object('id', v.id, 'name', v.name)) as vibes
        FROM songs s
        LEFT JOIN song_vibes sv ON s.id = sv.song_id
        LEFT JOIN vibes v ON sv.vibe_id = v.id
        GROUP BY s.id
        ORDER BY s.title
      `);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting all songs:', error);
      res.status(500).json({ success: false, error: 'Errore nel recupero delle canzoni' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query(`
        SELECT s.*, array_agg(json_build_object('id', v.id, 'name', v.name)) as vibes
        FROM songs s
        LEFT JOIN song_vibes sv ON s.id = sv.song_id
        LEFT JOIN vibes v ON sv.vibe_id = v.id
        WHERE s.id = $1
        GROUP BY s.id
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Canzone non trovata' });
      }
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error getting song by id:', error);
      res.status(500).json({ success: false, error: 'Errore nel recupero della canzone' });
    }
  },

  getByVibe: async (req, res) => {
    try {
      const { vibeId } = req.params;
      const result = await db.query(`
        SELECT s.*, array_agg(json_build_object('id', v.id, 'name', v.name)) as vibes
        FROM songs s
        JOIN song_vibes sv ON s.id = sv.song_id
        JOIN vibes v ON sv.vibe_id = v.id
        WHERE v.id = $1
        GROUP BY s.id
        ORDER BY s.title
      `, [vibeId]);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting songs by vibe:', error);
      res.status(500).json({ success: false, error: 'Errore nel recupero delle canzoni per questa vibe' });
    }
  },

  getRecent: async (req, res) => {
    try {
      const { limit = 6 } = req.query;
      const result = await db.query(`
        SELECT s.*, array_agg(json_build_object('id', v.id, 'name', v.name)) as vibes
        FROM songs s
        LEFT JOIN song_vibes sv ON s.id = sv.song_id
        LEFT JOIN vibes v ON sv.vibe_id = v.id
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT $1
      `, [limit]);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting recent songs:', error);
      res.status(500).json({ success: false, error: 'Errore nel recupero delle canzoni recenti' });
    }
  }
};

module.exports = songsController; 
const db = require('../db');

const contentController = {
  getAll: async (req, res) => {
    try {
      const { type } = req.query;
      let query = `
        SELECT c.*, array_agg(json_build_object('id', v.id, 'name', v.name)) as vibes
        FROM content c
        LEFT JOIN content_vibes cv ON c.id = cv.content_id
        LEFT JOIN vibes v ON cv.vibe_id = v.id
      `;
      
      const params = [];
      if (type) {
        query += ` WHERE c.type = $1`;
        params.push(type);
      }
      
      query += `
        GROUP BY c.id
        ORDER BY c.title
      `;
      
      const result = await db.query(query, params);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting all content:', error);
      res.status(500).json({ success: false, error: 'Errore nel recupero dei contenuti' });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query(`
        SELECT c.*, array_agg(json_build_object('id', v.id, 'name', v.name)) as vibes
        FROM content c
        LEFT JOIN content_vibes cv ON c.id = cv.content_id
        LEFT JOIN vibes v ON cv.vibe_id = v.id
        WHERE c.id = $1
        GROUP BY c.id
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Contenuto non trovato' });
      }
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error getting content by id:', error);
      res.status(500).json({ success: false, error: 'Errore nel recupero del contenuto' });
    }
  },

  getByVibe: async (req, res) => {
    try {
      const { vibeId } = req.params;
      const result = await db.query(`
        SELECT c.*, array_agg(json_build_object('id', v.id, 'name', v.name)) as vibes
        FROM content c
        JOIN content_vibes cv ON c.id = cv.content_id
        JOIN vibes v ON cv.vibe_id = v.id
        WHERE v.id = $1
        GROUP BY c.id
        ORDER BY c.title
      `, [vibeId]);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting content by vibe:', error);
      res.status(500).json({ success: false, error: 'Errore nel recupero dei contenuti per questa vibe' });
    }
  },

  getRecent: async (req, res) => {
    try {
      const { limit = 6 } = req.query;
      const result = await db.query(`
        SELECT c.*, array_agg(json_build_object('id', v.id, 'name', v.name)) as vibes
        FROM content c
        LEFT JOIN content_vibes cv ON c.id = cv.content_id
        LEFT JOIN vibes v ON cv.vibe_id = v.id
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT $1
      `, [limit]);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error getting recent content:', error);
      res.status(500).json({ success: false, error: 'Errore nel recupero dei contenuti recenti' });
    }
  }
};

module.exports = contentController; 
const db = require('../db');

const searchController = {
  search: async (req, res) => {
    try {
      const { q: query } = req.query;
      
      if (!query) {
        return res.status(400).json({ 
          success: false, 
          error: 'È necessario fornire un termine di ricerca' 
        });
      }

      // Cerca nelle canzoni
      const songsResult = await db.query(`
        SELECT s.*, array_agg(json_build_object('id', v.id, 'name', v.name)) as vibes
        FROM songs s
        LEFT JOIN song_vibes sv ON s.id = sv.song_id
        LEFT JOIN vibes v ON sv.vibe_id = v.id
        WHERE 
          s.title ILIKE $1 OR 
          s.artist ILIKE $1
        GROUP BY s.id
        ORDER BY s.title
        LIMIT 5
      `, [`%${query}%`]);

      // Cerca nei contenuti
      const contentResult = await db.query(`
        SELECT c.*, array_agg(json_build_object('id', v.id, 'name', v.name)) as vibes
        FROM content c
        LEFT JOIN content_vibes cv ON c.id = cv.content_id
        LEFT JOIN vibes v ON cv.vibe_id = v.id
        WHERE 
          c.title ILIKE $1 OR 
          c.description ILIKE $1
        GROUP BY c.id
        ORDER BY c.title
        LIMIT 5
      `, [`%${query}%`]);

      // Formatta i risultati
      const results = [
        ...songsResult.rows.map(song => ({
          type: 'song',
          item: song
        })),
        ...contentResult.rows.map(content => ({
          type: 'content',
          item: content
        }))
      ];

      res.json({ 
        success: true, 
        data: results
      });
    } catch (error) {
      console.error('Error searching:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Errore durante la ricerca' 
      });
    }
  }
};

module.exports = searchController; 
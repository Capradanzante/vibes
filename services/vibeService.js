const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class VibeService {
  async getAllVibes() {
    try {
      const result = await db.query(`
        SELECT v.*, 
               COUNT(DISTINCT sv.song_id) as songs_count,
               COUNT(DISTINCT cv.content_id) as content_count
        FROM vibes v
        LEFT JOIN song_vibes sv ON v.id = sv.vibe_id
        LEFT JOIN content_vibes cv ON v.id = cv.vibe_id
        GROUP BY v.id
        ORDER BY v.name
      `);
      return result.rows;
    } catch (error) {
      throw new Error(`Errore nel recupero delle vibes: ${error.message}`);
    }
  }

  async getVibeById(vibeId) {
    try {
      const result = await db.query(`
        SELECT v.*, 
               COUNT(DISTINCT sv.song_id) as songs_count,
               COUNT(DISTINCT cv.content_id) as content_count
        FROM vibes v
        LEFT JOIN song_vibes sv ON v.id = sv.vibe_id
        LEFT JOIN content_vibes cv ON v.id = cv.vibe_id
        WHERE v.id = $1
        GROUP BY v.id
      `, [vibeId]);

      if (result.rows.length === 0) {
        throw new Error('Vibe non trovata');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Errore nel recupero della vibe: ${error.message}`);
    }
  }

  async createVibe(vibeData) {
    const { name, description, category, intensity, color, icon } = vibeData;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
      const result = await db.query(`
        INSERT INTO vibes (
          id, name, slug, description, category, 
          intensity, color, icon, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        uuidv4(), name, slug, description, category,
        intensity, color, icon
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Errore nella creazione della vibe: ${error.message}`);
    }
  }

  async updateVibe(vibeId, vibeData) {
    const { name, description, category, intensity, color, icon } = vibeData;
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined;

    try {
      const result = await db.query(`
        UPDATE vibes
        SET name = COALESCE($1, name),
            slug = COALESCE($2, slug),
            description = COALESCE($3, description),
            category = COALESCE($4, category),
            intensity = COALESCE($5, intensity),
            color = COALESCE($6, color),
            icon = COALESCE($7, icon)
        WHERE id = $8
        RETURNING *
      `, [name, slug, description, category, intensity, color, icon, vibeId]);

      if (result.rows.length === 0) {
        throw new Error('Vibe non trovata');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento della vibe: ${error.message}`);
    }
  }

  async deleteVibe(vibeId) {
    try {
      const result = await db.query(
        'DELETE FROM vibes WHERE id = $1 RETURNING *',
        [vibeId]
      );

      if (result.rows.length === 0) {
        throw new Error('Vibe non trovata');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Errore nell'eliminazione della vibe: ${error.message}`);
    }
  }

  async getPopularVibes(limit = 8) {
    try {
      const result = await db.query(`
        SELECT v.*, 
               COUNT(DISTINCT sv.song_id) + COUNT(DISTINCT cv.content_id) as total_usage
        FROM vibes v
        LEFT JOIN song_vibes sv ON v.id = sv.vibe_id
        LEFT JOIN content_vibes cv ON v.id = cv.vibe_id
        GROUP BY v.id
        ORDER BY total_usage DESC
        LIMIT $1
      `, [limit]);

      return result.rows;
    } catch (error) {
      throw new Error(`Errore nel recupero delle vibes popolari: ${error.message}`);
    }
  }

  async analyzeContent(content) {
    // Qui implementeremo l'analisi del contenuto per generare vibes
    // Per ora restituiamo alcune vibes di esempio basate sul tipo di contenuto
    try {
      const vibes = [];
      const description = content.description?.toLowerCase() || '';
      const title = content.title?.toLowerCase() || '';

      if (description.includes('avventura') || title.includes('avventura')) {
        vibes.push({
          vibe_id: await this._getVibeIdByName('Avventuroso'),
          intensity: 0.8,
          confidence_score: 0.9
        });
      }

      if (description.includes('amore') || title.includes('amore')) {
        vibes.push({
          vibe_id: await this._getVibeIdByName('Romantico'),
          intensity: 0.7,
          confidence_score: 0.85
        });
      }

      // Aggiungi altre regole di analisi qui...

      return vibes;
    } catch (error) {
      throw new Error(`Errore nell'analisi del contenuto: ${error.message}`);
    }
  }

  async _getVibeIdByName(name) {
    const result = await db.query(
      'SELECT id FROM vibes WHERE name = $1',
      [name]
    );
    return result.rows[0]?.id;
  }
}

module.exports = new VibeService(); 
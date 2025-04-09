const { pool } = require('../db');

class VibeService {
  async getAllVibes() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT v.*, 
          COUNT(DISTINCT sv.song_id) as song_count,
          COUNT(DISTINCT cv.content_id) as content_count
        FROM vibes v
        LEFT JOIN song_vibes sv ON v.id = sv.vibe_id
        LEFT JOIN content_vibes cv ON v.id = cv.vibe_id
        GROUP BY v.id
        ORDER BY v.name
      `);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getVibeById(id) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM vibes WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Vibe not found');
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async createVibe(vibeData) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO vibes (name, color)
         VALUES ($1, $2)
         RETURNING *`,
        [vibeData.name, vibeData.color]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async updateVibe(id, vibeData) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `UPDATE vibes
         SET name = COALESCE($1, name),
             color = COALESCE($2, color),
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [vibeData.name, vibeData.color, id]
      );

      if (result.rows.length === 0) {
        throw new Error('Vibe not found');
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteVibe(id) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM vibes WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Vibe not found');
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getPopularVibes(limit = 10) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT v.*, 
          COUNT(DISTINCT sv.song_id) + COUNT(DISTINCT cv.content_id) as total_count
        FROM vibes v
        LEFT JOIN song_vibes sv ON v.id = sv.vibe_id
        LEFT JOIN content_vibes cv ON v.id = cv.vibe_id
        GROUP BY v.id
        ORDER BY total_count DESC
        LIMIT $1
      `, [limit]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  async analyzeContent(content) {
    const client = await pool.connect();
    try {
      // Extract keywords from content
      const keywords = this._extractKeywords(content);
      
      // Find matching vibes
      const result = await client.query(`
        SELECT DISTINCT v.*
        FROM vibes v
        WHERE v.name ILIKE ANY($1::text[])
        OR v.name IN (
          SELECT unnest(string_to_array($2, ' '))
        )
      `, [keywords, content.title + ' ' + content.description]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  _extractKeywords(content) {
    // Simple keyword extraction - can be enhanced with NLP
    const text = content.title + ' ' + content.description;
    const words = text.toLowerCase().split(/\s+/);
    return words.filter(word => word.length > 3);
  }

  async _getVibeIdByName(name) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id FROM vibes WHERE name = $1',
        [name]
      );
      return result.rows[0]?.id;
    } finally {
      client.release();
    }
  }
}

module.exports = new VibeService(); 
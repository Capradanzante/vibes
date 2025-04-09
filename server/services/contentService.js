const { pool } = require('../db');
const vibeService = require('./vibeService');

class ContentService {
  async getAllContent(type = null, limit = 10, offset = 0) {
    const client = await pool.connect();
    try {
      const values = [limit, offset];
      let query = `
        SELECT c.*, array_agg(jsonb_build_object('id', v.id, 'name', v.name)) as vibes
        FROM content c
        LEFT JOIN content_vibes cv ON c.id = cv.content_id
        LEFT JOIN vibes v ON cv.vibe_id = v.id
      `;

      if (type) {
        query += ' WHERE c.type = $3';
        values.push(type);
      }

      query += `
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const result = await client.query(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getContentById(id) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT c.*, array_agg(jsonb_build_object('id', v.id, 'name', v.name)) as vibes
        FROM content c
        LEFT JOIN content_vibes cv ON c.id = cv.content_id
        LEFT JOIN vibes v ON cv.vibe_id = v.id
        WHERE c.id = $1
        GROUP BY c.id
      `, [id]);

      if (result.rows.length === 0) {
        throw new Error('Content not found');
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async createContent(contentData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(`
        INSERT INTO content (
          title, description, type, release_year, poster_url,
          rating, popularity, genres, keywords, original_language,
          original_title, vote_average, vote_count, runtime,
          status, tagline, homepage, imdb_id, tmdb_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `, [
        contentData.title,
        contentData.description,
        contentData.type,
        contentData.release_year,
        contentData.poster_url,
        contentData.rating,
        contentData.popularity,
        contentData.genres,
        contentData.keywords,
        contentData.original_language,
        contentData.original_title,
        contentData.vote_average,
        contentData.vote_count,
        contentData.runtime,
        contentData.status,
        contentData.tagline,
        contentData.homepage,
        contentData.imdb_id,
        contentData.tmdb_id
      ]);

      const content = result.rows[0];

      // Analyze content and get vibes
      const vibes = await vibeService.analyzeContent({
        title: content.title,
        description: content.description
      });

      // Associate vibes with content
      for (const vibe of vibes) {
        await client.query(
          'INSERT INTO content_vibes (content_id, vibe_id) VALUES ($1, $2)',
          [content.id, vibe.id]
        );
      }

      await client.query('COMMIT');

      return {
        ...content,
        vibes
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateContent(id, contentData) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        UPDATE content
        SET title = COALESCE($1, title),
            description = COALESCE($2, description),
            type = COALESCE($3, type),
            release_year = COALESCE($4, release_year),
            poster_url = COALESCE($5, poster_url),
            rating = COALESCE($6, rating),
            popularity = COALESCE($7, popularity),
            genres = COALESCE($8, genres),
            keywords = COALESCE($9, keywords),
            original_language = COALESCE($10, original_language),
            original_title = COALESCE($11, original_title),
            vote_average = COALESCE($12, vote_average),
            vote_count = COALESCE($13, vote_count),
            runtime = COALESCE($14, runtime),
            status = COALESCE($15, status),
            tagline = COALESCE($16, tagline),
            homepage = COALESCE($17, homepage),
            imdb_id = COALESCE($18, imdb_id),
            tmdb_id = COALESCE($19, tmdb_id),
            updated_at = NOW()
        WHERE id = $20
        RETURNING *
      `, [
        contentData.title,
        contentData.description,
        contentData.type,
        contentData.release_year,
        contentData.poster_url,
        contentData.rating,
        contentData.popularity,
        contentData.genres,
        contentData.keywords,
        contentData.original_language,
        contentData.original_title,
        contentData.vote_average,
        contentData.vote_count,
        contentData.runtime,
        contentData.status,
        contentData.tagline,
        contentData.homepage,
        contentData.imdb_id,
        contentData.tmdb_id,
        id
      ]);

      if (result.rows.length === 0) {
        throw new Error('Content not found');
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteContent(id) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM content WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Content not found');
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async searchContent(query, type = null, limit = 10) {
    const client = await pool.connect();
    try {
      const values = [query, limit];
      let sql = `
        SELECT c.*, array_agg(jsonb_build_object('id', v.id, 'name', v.name)) as vibes
        FROM content c
        LEFT JOIN content_vibes cv ON c.id = cv.content_id
        LEFT JOIN vibes v ON cv.vibe_id = v.id
        WHERE to_tsvector('english', c.title || ' ' || COALESCE(c.description, '')) @@ plainto_tsquery('english', $1)
      `;

      if (type) {
        sql += ' AND c.type = $3';
        values.push(type);
      }

      sql += `
        GROUP BY c.id
        ORDER BY ts_rank(to_tsvector('english', c.title || ' ' || COALESCE(c.description, '')), plainto_tsquery('english', $1)) DESC
        LIMIT $2
      `;

      const result = await client.query(sql, values);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getContentByVibe(vibeId, type = null, limit = 10) {
    const client = await pool.connect();
    try {
      const values = [vibeId, limit];
      let query = `
        SELECT c.*, array_agg(jsonb_build_object('id', v.id, 'name', v.name)) as vibes
        FROM content c
        INNER JOIN content_vibes cv ON c.id = cv.content_id
        LEFT JOIN vibes v ON cv.vibe_id = v.id
        WHERE cv.vibe_id = $1
      `;

      if (type) {
        query += ' AND c.type = $3';
        values.push(type);
      }

      query += `
        GROUP BY c.id
        ORDER BY c.popularity DESC
        LIMIT $2
      `;

      const result = await client.query(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

module.exports = new ContentService(); 
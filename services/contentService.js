const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const vibeService = require('./vibeService');

class ContentService {
  async getAllContent(type = null, limit = 20, offset = 0) {
    try {
      let query = `
        SELECT c.*, 
               array_agg(DISTINCT jsonb_build_object(
                 'id', v.id,
                 'name', v.name,
                 'intensity', cv.intensity
               )) as vibes
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
        ORDER BY c.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      params.push(limit, offset);

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Errore nel recupero dei contenuti: ${error.message}`);
    }
  }

  async getContentById(contentId) {
    try {
      const result = await db.query(`
        SELECT c.*, 
               array_agg(DISTINCT jsonb_build_object(
                 'id', v.id,
                 'name', v.name,
                 'intensity', cv.intensity
               )) as vibes
        FROM content c
        LEFT JOIN content_vibes cv ON c.id = cv.content_id
        LEFT JOIN vibes v ON cv.vibe_id = v.id
        WHERE c.id = $1
        GROUP BY c.id
      `, [contentId]);

      if (result.rows.length === 0) {
        throw new Error('Contenuto non trovato');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Errore nel recupero del contenuto: ${error.message}`);
    }
  }

  async createContent(contentData) {
    const {
      title,
      original_title,
      type,
      release_year,
      release_date,
      duration,
      description,
      tagline,
      poster_url,
      backdrop_url,
      tmdb_id,
      imdb_id
    } = contentData;

    try {
      // Inizia una transazione
      await db.query('BEGIN');

      // Inserisci il contenuto
      const contentResult = await db.query(`
        INSERT INTO content (
          id, title, original_title, type, release_year,
          release_date, duration, description, tagline,
          poster_url, backdrop_url, tmdb_id, imdb_id,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        uuidv4(), title, original_title, type, release_year,
        release_date, duration, description, tagline,
        poster_url, backdrop_url, tmdb_id, imdb_id
      ]);

      const content = contentResult.rows[0];

      // Analizza il contenuto per generare vibes
      const vibes = await vibeService.analyzeContent(content);

      // Inserisci le vibes associate
      for (const vibe of vibes) {
        await db.query(`
          INSERT INTO content_vibes (
            content_id, vibe_id, intensity, 
            confidence_score, source, created_at
          )
          VALUES ($1, $2, $3, $4, 'system', CURRENT_TIMESTAMP)
        `, [
          content.id,
          vibe.vibe_id,
          vibe.intensity,
          vibe.confidence_score
        ]);
      }

      // Commit della transazione
      await db.query('COMMIT');

      // Recupera il contenuto con le vibes associate
      return this.getContentById(content.id);
    } catch (error) {
      // Rollback in caso di errore
      await db.query('ROLLBACK');
      throw new Error(`Errore nella creazione del contenuto: ${error.message}`);
    }
  }

  async updateContent(contentId, contentData) {
    const {
      title,
      original_title,
      type,
      release_year,
      release_date,
      duration,
      description,
      tagline,
      poster_url,
      backdrop_url,
      tmdb_id,
      imdb_id
    } = contentData;

    try {
      const result = await db.query(`
        UPDATE content
        SET title = COALESCE($1, title),
            original_title = COALESCE($2, original_title),
            type = COALESCE($3, type),
            release_year = COALESCE($4, release_year),
            release_date = COALESCE($5, release_date),
            duration = COALESCE($6, duration),
            description = COALESCE($7, description),
            tagline = COALESCE($8, tagline),
            poster_url = COALESCE($9, poster_url),
            backdrop_url = COALESCE($10, backdrop_url),
            tmdb_id = COALESCE($11, tmdb_id),
            imdb_id = COALESCE($12, imdb_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
        RETURNING *
      `, [
        title, original_title, type, release_year,
        release_date, duration, description, tagline,
        poster_url, backdrop_url, tmdb_id, imdb_id,
        contentId
      ]);

      if (result.rows.length === 0) {
        throw new Error('Contenuto non trovato');
      }

      return this.getContentById(contentId);
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento del contenuto: ${error.message}`);
    }
  }

  async deleteContent(contentId) {
    try {
      const result = await db.query(
        'DELETE FROM content WHERE id = $1 RETURNING *',
        [contentId]
      );

      if (result.rows.length === 0) {
        throw new Error('Contenuto non trovato');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Errore nell'eliminazione del contenuto: ${error.message}`);
    }
  }

  async searchContent(query, type = null, limit = 20) {
    try {
      let sqlQuery = `
        SELECT c.*, 
               array_agg(DISTINCT jsonb_build_object(
                 'id', v.id,
                 'name', v.name,
                 'intensity', cv.intensity
               )) as vibes,
               ts_rank_cd(
                 to_tsvector('italian', 
                   title || ' ' || 
                   COALESCE(original_title, '') || ' ' || 
                   COALESCE(description, '')
                 ),
                 plainto_tsquery('italian', $1)
               ) as rank
        FROM content c
        LEFT JOIN content_vibes cv ON c.id = cv.content_id
        LEFT JOIN vibes v ON cv.vibe_id = v.id
        WHERE to_tsvector('italian', 
                title || ' ' || 
                COALESCE(original_title, '') || ' ' || 
                COALESCE(description, '')
              ) @@ plainto_tsquery('italian', $1)
      `;

      const params = [query];

      if (type) {
        sqlQuery += ` AND c.type = $2`;
        params.push(type);
      }

      sqlQuery += `
        GROUP BY c.id
        ORDER BY rank DESC
        LIMIT $${params.length + 1}
      `;
      params.push(limit);

      const result = await db.query(sqlQuery, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Errore nella ricerca dei contenuti: ${error.message}`);
    }
  }

  async getContentByVibe(vibeId, type = null, limit = 20) {
    try {
      let query = `
        SELECT c.*, 
               array_agg(DISTINCT jsonb_build_object(
                 'id', v.id,
                 'name', v.name,
                 'intensity', cv.intensity
               )) as vibes
        FROM content c
        JOIN content_vibes cv ON c.id = cv.content_id
        LEFT JOIN vibes v ON cv.vibe_id = v.id
        WHERE cv.vibe_id = $1
      `;

      const params = [vibeId];

      if (type) {
        query += ` AND c.type = $2`;
        params.push(type);
      }

      query += `
        GROUP BY c.id
        ORDER BY cv.intensity DESC
        LIMIT $${params.length + 1}
      `;
      params.push(limit);

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Errore nel recupero dei contenuti per vibe: ${error.message}`);
    }
  }
}

module.exports = new ContentService(); 
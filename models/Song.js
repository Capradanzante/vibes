const db = require('../db');

class Song {
  static async getAll() {
    try {
      const result = await db.query('SELECT * FROM songs ORDER BY title');
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  static async create(songData) {
    const { title, artist, album, release_year, spotify_id } = songData;
    try {
      const result = await db.query(
        'INSERT INTO songs (title, artist, album, release_year, spotify_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [title, artist, album, release_year, spotify_id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Song; 
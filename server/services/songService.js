const { pool } = require('../db');
const SpotifyWebApi = require('spotify-web-api-node');
const vibeService = require('./vibeService');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

class SongService {
  async getAllSongs(limit = 10, offset = 0) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT s.*, array_agg(jsonb_build_object('id', v.id, 'name', v.name)) as vibes
        FROM songs s
        LEFT JOIN song_vibes sv ON s.id = sv.song_id
        LEFT JOIN vibes v ON sv.vibe_id = v.id
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  async getSongById(id) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT s.*, array_agg(jsonb_build_object('id', v.id, 'name', v.name)) as vibes
        FROM songs s
        LEFT JOIN song_vibes sv ON s.id = sv.song_id
        LEFT JOIN vibes v ON sv.vibe_id = v.id
        WHERE s.id = $1
        GROUP BY s.id
      `, [id]);

      if (result.rows.length === 0) {
        throw new Error('Song not found');
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async createSong(songData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(`
        INSERT INTO songs (
          title, artist, album, release_year, cover_url,
          duration, genre, popularity, preview_url, spotify_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        songData.title,
        songData.artist,
        songData.album,
        songData.release_year,
        songData.cover_url,
        songData.duration,
        songData.genre,
        songData.popularity,
        songData.preview_url,
        songData.spotify_id
      ]);

      const song = result.rows[0];

      // Analyze song and get vibes
      const vibes = await vibeService.analyzeContent({
        title: song.title,
        description: `${song.artist} - ${song.album}`
      });

      // Associate vibes with song
      for (const vibe of vibes) {
        await client.query(
          'INSERT INTO song_vibes (song_id, vibe_id) VALUES ($1, $2)',
          [song.id, vibe.id]
        );
      }

      await client.query('COMMIT');

      return {
        ...song,
        vibes
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateSong(id, songData) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        UPDATE songs
        SET title = COALESCE($1, title),
            artist = COALESCE($2, artist),
            album = COALESCE($3, album),
            release_year = COALESCE($4, release_year),
            cover_url = COALESCE($5, cover_url),
            duration = COALESCE($6, duration),
            genre = COALESCE($7, genre),
            popularity = COALESCE($8, popularity),
            preview_url = COALESCE($9, preview_url),
            spotify_id = COALESCE($10, spotify_id),
            updated_at = NOW()
        WHERE id = $11
        RETURNING *
      `, [
        songData.title,
        songData.artist,
        songData.album,
        songData.release_year,
        songData.cover_url,
        songData.duration,
        songData.genre,
        songData.popularity,
        songData.preview_url,
        songData.spotify_id,
        id
      ]);

      if (result.rows.length === 0) {
        throw new Error('Song not found');
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteSong(id) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM songs WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error('Song not found');
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async searchSongs(query, limit = 10) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT s.*, array_agg(jsonb_build_object('id', v.id, 'name', v.name)) as vibes
        FROM songs s
        LEFT JOIN song_vibes sv ON s.id = sv.song_id
        LEFT JOIN vibes v ON sv.vibe_id = v.id
        WHERE s.title ILIKE $1 OR s.artist ILIKE $1
        GROUP BY s.id
        ORDER BY s.popularity DESC
        LIMIT $2
      `, [`%${query}%`, limit]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  async getSongsByVibe(vibeId, limit = 10) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT s.*, array_agg(jsonb_build_object('id', v.id, 'name', v.name)) as vibes
        FROM songs s
        JOIN song_vibes sv ON s.id = sv.song_id
        LEFT JOIN vibes v ON sv.vibe_id = v.id
        WHERE sv.vibe_id = $1
        GROUP BY s.id
        ORDER BY s.popularity DESC
        LIMIT $2
      `, [vibeId, limit]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  async searchSpotify(query, limit = 10) {
    try {
      await this._refreshSpotifyToken();
      const data = await spotifyApi.searchTracks(query, { limit });
      return data.body.tracks.items.map(track => ({
        title: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        release_year: new Date(track.album.release_date).getFullYear(),
        cover_url: track.album.images[0]?.url,
        duration: track.duration_ms,
        genre: null, // Spotify API doesn't provide genre in track search
        popularity: track.popularity,
        preview_url: track.preview_url,
        spotify_id: track.id
      }));
    } catch (error) {
      console.error('Spotify search error:', error);
      throw new Error('Error searching Spotify');
    }
  }

  async getSpotifyTrack(id) {
    try {
      await this._refreshSpotifyToken();
      const data = await spotifyApi.getTrack(id);
      return data.body;
    } catch (error) {
      console.error('Spotify track error:', error);
      throw new Error('Error getting Spotify track');
    }
  }

  async getSpotifyArtist(id) {
    try {
      await this._refreshSpotifyToken();
      const data = await spotifyApi.getArtist(id);
      return data.body;
    } catch (error) {
      console.error('Spotify artist error:', error);
      throw new Error('Error getting Spotify artist');
    }
  }

  async getSpotifyAlbum(id) {
    try {
      await this._refreshSpotifyToken();
      const data = await spotifyApi.getAlbum(id);
      return data.body;
    } catch (error) {
      console.error('Spotify album error:', error);
      throw new Error('Error getting Spotify album');
    }
  }

  async _refreshSpotifyToken() {
    try {
      const data = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(data.body.access_token);
      return data.body.access_token;
    } catch (error) {
      console.error('Spotify token refresh error:', error);
      throw new Error('Error refreshing Spotify token');
    }
  }
}

module.exports = new SongService(); 
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const SpotifyWebApi = require('spotify-web-api-node');
const vibeService = require('./vibeService');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

// Funzione per aggiornare il token di Spotify
async function refreshSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
  } catch (error) {
    console.error('Errore nel refresh del token Spotify:', error);
  }
}

// Refresh iniziale del token
refreshSpotifyToken();
// Refresh del token ogni ora
setInterval(refreshSpotifyToken, 3600000);

class SongService {
  async getAllSongs(limit = 20, offset = 0) {
    try {
      const result = await db.query(`
        SELECT s.*, 
               array_agg(DISTINCT jsonb_build_object(
                 'id', v.id,
                 'name', v.name,
                 'intensity', sv.intensity
               )) as vibes
        FROM songs s
        LEFT JOIN song_vibes sv ON s.id = sv.song_id
        LEFT JOIN vibes v ON sv.vibe_id = v.id
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      return result.rows;
    } catch (error) {
      throw new Error(`Errore nel recupero delle canzoni: ${error.message}`);
    }
  }

  async getSongById(songId) {
    try {
      const result = await db.query(`
        SELECT s.*, 
               array_agg(DISTINCT jsonb_build_object(
                 'id', v.id,
                 'name', v.name,
                 'intensity', sv.intensity
               )) as vibes
        FROM songs s
        LEFT JOIN song_vibes sv ON s.id = sv.song_id
        LEFT JOIN vibes v ON sv.vibe_id = v.id
        WHERE s.id = $1
        GROUP BY s.id
      `, [songId]);

      if (result.rows.length === 0) {
        throw new Error('Canzone non trovata');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Errore nel recupero della canzone: ${error.message}`);
    }
  }

  async createSong(songData) {
    const {
      title,
      artist,
      album,
      duration,
      release_year,
      spotify_id,
      spotify_url,
      preview_url
    } = songData;

    try {
      // Inizia una transazione
      await db.query('BEGIN');

      // Normalizza il titolo per la ricerca
      const normalized_title = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      // Inserisci la canzone
      const songResult = await db.query(`
        INSERT INTO songs (
          id, title, normalized_title, artist, album,
          duration, release_year, spotify_id, spotify_url,
          preview_url, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [
        uuidv4(), title, normalized_title, artist, album,
        duration, release_year, spotify_id, spotify_url,
        preview_url
      ]);

      const song = songResult.rows[0];

      // Se c'è un ID Spotify, recupera le caratteristiche audio
      if (spotify_id) {
        try {
          const audioFeatures = await this.getSpotifyAudioFeatures(spotify_id);
          if (audioFeatures) {
            await db.query(`
              UPDATE songs
              SET audio_features = $1
              WHERE id = $2
            `, [audioFeatures, song.id]);
            song.audio_features = audioFeatures;
          }
        } catch (spotifyError) {
          console.error('Errore nel recupero delle caratteristiche audio:', spotifyError);
        }
      }

      // Analizza la canzone per generare vibes
      const vibes = await this.analyzeSongVibes(song);

      // Inserisci le vibes associate
      for (const vibe of vibes) {
        await db.query(`
          INSERT INTO song_vibes (
            song_id, vibe_id, intensity,
            confidence_score, source, created_at
          )
          VALUES ($1, $2, $3, $4, 'system', CURRENT_TIMESTAMP)
        `, [
          song.id,
          vibe.vibe_id,
          vibe.intensity,
          vibe.confidence_score
        ]);
      }

      // Commit della transazione
      await db.query('COMMIT');

      // Recupera la canzone con le vibes associate
      return this.getSongById(song.id);
    } catch (error) {
      // Rollback in caso di errore
      await db.query('ROLLBACK');
      throw new Error(`Errore nella creazione della canzone: ${error.message}`);
    }
  }

  async updateSong(songId, songData) {
    const {
      title,
      artist,
      album,
      duration,
      release_year,
      spotify_id,
      spotify_url,
      preview_url
    } = songData;

    try {
      const normalized_title = title ? 
        title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : 
        undefined;

      const result = await db.query(`
        UPDATE songs
        SET title = COALESCE($1, title),
            normalized_title = COALESCE($2, normalized_title),
            artist = COALESCE($3, artist),
            album = COALESCE($4, album),
            duration = COALESCE($5, duration),
            release_year = COALESCE($6, release_year),
            spotify_id = COALESCE($7, spotify_id),
            spotify_url = COALESCE($8, spotify_url),
            preview_url = COALESCE($9, preview_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING *
      `, [
        title, normalized_title, artist, album,
        duration, release_year, spotify_id, spotify_url,
        preview_url, songId
      ]);

      if (result.rows.length === 0) {
        throw new Error('Canzone non trovata');
      }

      return this.getSongById(songId);
    } catch (error) {
      throw new Error(`Errore nell'aggiornamento della canzone: ${error.message}`);
    }
  }

  async deleteSong(songId) {
    try {
      const result = await db.query(
        'DELETE FROM songs WHERE id = $1 RETURNING *',
        [songId]
      );

      if (result.rows.length === 0) {
        throw new Error('Canzone non trovata');
      }

      return result.rows[0];
    } catch (error) {
      throw new Error(`Errore nell'eliminazione della canzone: ${error.message}`);
    }
  }

  async searchSongs(query, limit = 20) {
    try {
      const result = await db.query(`
        SELECT s.*, 
               array_agg(DISTINCT jsonb_build_object(
                 'id', v.id,
                 'name', v.name,
                 'intensity', sv.intensity
               )) as vibes,
               ts_rank_cd(
                 to_tsvector('italian', 
                   title || ' ' || 
                   artist || ' ' || 
                   COALESCE(album, '')
                 ),
                 plainto_tsquery('italian', $1)
               ) as rank
        FROM songs s
        LEFT JOIN song_vibes sv ON s.id = sv.song_id
        LEFT JOIN vibes v ON sv.vibe_id = v.id
        WHERE to_tsvector('italian', 
                title || ' ' || 
                artist || ' ' || 
                COALESCE(album, '')
              ) @@ plainto_tsquery('italian', $1)
        GROUP BY s.id
        ORDER BY rank DESC
        LIMIT $2
      `, [query, limit]);

      return result.rows;
    } catch (error) {
      throw new Error(`Errore nella ricerca delle canzoni: ${error.message}`);
    }
  }

  async getSongsByVibe(vibeId, limit = 20) {
    try {
      const result = await db.query(`
        SELECT s.*, 
               array_agg(DISTINCT jsonb_build_object(
                 'id', v.id,
                 'name', v.name,
                 'intensity', sv.intensity
               )) as vibes
        FROM songs s
        JOIN song_vibes sv ON s.id = sv.song_id
        LEFT JOIN vibes v ON sv.vibe_id = v.id
        WHERE sv.vibe_id = $1
        GROUP BY s.id
        ORDER BY sv.intensity DESC
        LIMIT $2
      `, [vibeId, limit]);

      return result.rows;
    } catch (error) {
      throw new Error(`Errore nel recupero delle canzoni per vibe: ${error.message}`);
    }
  }

  async getSpotifyAudioFeatures(spotifyId) {
    try {
      const response = await spotifyApi.getAudioFeaturesForTrack(spotifyId);
      return response.body;
    } catch (error) {
      console.error('Errore nel recupero delle caratteristiche audio da Spotify:', error);
      return null;
    }
  }

  async analyzeSongVibes(song) {
    const vibes = [];
    
    // Analisi basata sulle caratteristiche audio di Spotify
    if (song.audio_features) {
      const {
        danceability,
        energy,
        valence,
        tempo,
        mode,
        instrumentalness
      } = song.audio_features;

      // Esempio di regole per l'assegnazione delle vibes
      if (energy > 0.8 && tempo > 120) {
        vibes.push({
          vibe_id: await vibeService._getVibeIdByName('Energetico'),
          intensity: energy,
          confidence_score: 0.9
        });
      }

      if (valence > 0.7 && danceability > 0.7) {
        vibes.push({
          vibe_id: await vibeService._getVibeIdByName('Tropicale'),
          intensity: (valence + danceability) / 2,
          confidence_score: 0.85
        });
      }

      if (valence < 0.3 && mode === 0) {
        vibes.push({
          vibe_id: await vibeService._getVibeIdByName('Misterioso'),
          intensity: 1 - valence,
          confidence_score: 0.8
        });
      }

      // Aggiungi altre regole basate sulle caratteristiche audio...
    }

    // Analisi basata sul titolo e sull'artista
    const titleLower = song.title.toLowerCase();
    const artistLower = song.artist.toLowerCase();

    if (titleLower.includes('love') || titleLower.includes('amore')) {
      vibes.push({
        vibe_id: await vibeService._getVibeIdByName('Romantico'),
        intensity: 0.8,
        confidence_score: 0.7
      });
    }

    // Aggiungi altre regole basate sul testo...

    return vibes;
  }
}

module.exports = new SongService(); 
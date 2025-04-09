const db = require('../db');

const searchContent = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // Search in movies and shows
    const moviesShowsQuery = `
      SELECT 
        ms.id,
        ms.title,
        ms.release_year,
        ms.poster_url,
        ms.type,
        ms.overview,
        ms.rating,
        ms.popularity,
        ms.genres,
        ms.keywords,
        ms.original_language,
        ms.original_title,
        ms.vote_average,
        ms.vote_count,
        ms.runtime,
        ms.status,
        ms.tagline,
        ms.homepage,
        ms.imdb_id,
        ms.tmdb_id,
        ms.budget,
        ms.revenue,
        ms.production_companies,
        ms.production_countries,
        ms.spoken_languages,
        ms.created_at,
        ms.updated_at,
        array_agg(DISTINCT cv.vibe_id) as vibe_ids
      FROM movies_shows ms
      LEFT JOIN content_vibes cv ON ms.id = cv.content_id
      WHERE ms.title ILIKE $1
      GROUP BY ms.id
      LIMIT 10
    `;

    // Search in songs
    const songsQuery = `
      SELECT 
        s.id,
        s.title,
        s.artist,
        s.album,
        s.release_year,
        s.cover_url,
        s.duration,
        s.genre,
        s.popularity,
        s.preview_url,
        s.spotify_id,
        s.lastfm_url,
        s.created_at,
        s.updated_at,
        array_agg(DISTINCT sv.vibe_id) as vibe_ids
      FROM songs s
      LEFT JOIN song_vibes sv ON s.id = sv.song_id
      WHERE s.title ILIKE $1 OR s.artist ILIKE $1
      GROUP BY s.id
      LIMIT 10
    `;

    const searchTerm = `%${q}%`;
    
    const [moviesShowsResults, songsResults] = await Promise.all([
      db.query(moviesShowsQuery, [searchTerm]),
      db.query(songsQuery, [searchTerm])
    ]);

    // Get vibe names for movies and shows
    const movieVibesQuery = `
      SELECT DISTINCT v.id, v.name
      FROM vibes v
      JOIN content_vibes cv ON v.id = cv.vibe_id
      WHERE cv.content_id = ANY($1)
    `;

    // Get vibe names for songs
    const songVibesQuery = `
      SELECT DISTINCT v.id, v.name
      FROM vibes v
      JOIN song_vibes sv ON v.id = sv.vibe_id
      WHERE sv.song_id = ANY($1)
    `;

    const movieIds = moviesShowsResults.rows.map(row => row.id);
    const songIds = songsResults.rows.map(row => row.id);

    const [movieVibes, songVibes] = await Promise.all([
      movieIds.length ? db.query(movieVibesQuery, [movieIds]) : { rows: [] },
      songIds.length ? db.query(songVibesQuery, [songIds]) : { rows: [] }
    ]);

    // Map vibes to results
    const moviesShowsWithVibes = moviesShowsResults.rows.map(row => ({
      ...row,
      vibes: movieVibes.rows.filter(v => row.vibe_ids.includes(v.id))
    }));

    const songsWithVibes = songsResults.rows.map(row => ({
      ...row,
      vibes: songVibes.rows.filter(v => row.vibe_ids.includes(v.id))
    }));

    res.json({
      movies_shows: moviesShowsWithVibes,
      songs: songsWithVibes
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  searchContent
}; 
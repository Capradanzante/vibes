const { tmdbApi, lastfmApi } = require('../config/api');
const db = require('../db');
const { VIBES_CATEGORIES } = require('../routes/public');

async function populateMoviesAndShows() {
  try {
    // Get popular movies
    const popularMovies = await tmdbApi.get('/movie/popular');
    const topRatedMovies = await tmdbApi.get('/movie/top_rated');
    const upcomingMovies = await tmdbApi.get('/movie/upcoming');

    // Get popular TV shows
    const popularTVShows = await tmdbApi.get('/tv/popular');
    const topRatedTVShows = await tmdbApi.get('/tv/top_rated');
    
    const allContent = [
      ...popularMovies.data.results,
      ...topRatedMovies.data.results,
      ...upcomingMovies.data.results,
      ...popularTVShows.data.results,
      ...topRatedTVShows.data.results
    ];

    for (const content of allContent) {
      const isMovie = 'title' in content;
      const details = await tmdbApi.get(`/${isMovie ? 'movie' : 'tv'}/${content.id}`);
      
      // Insert into database
      const query = `
        INSERT INTO movies_shows (
          title, type, release_year, description, poster_url, tmdb_id
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (tmdb_id) DO UPDATE
        SET title = EXCLUDED.title,
            description = EXCLUDED.description,
            poster_url = EXCLUDED.poster_url
        RETURNING id
      `;

      const values = [
        isMovie ? content.title : content.name,
        isMovie ? 'movie' : 'tv_show',
        isMovie ? new Date(content.release_date).getFullYear() : content.first_air_date.substring(0, 4),
        content.overview,
        `https://image.tmdb.org/t/p/w500${content.poster_path}`,
        content.id.toString()
      ];

      const result = await db.query(query, values);
      const contentId = result.rows[0].id;

      // Analyze content for vibes
      const vibes = detectVibesFromContent(content, details.data);
      
      // Insert vibes
      for (const vibe of vibes) {
        await db.query(`
          INSERT INTO content_vibes (content_id, vibe_id, strength)
          VALUES ($1, $2, $3)
          ON CONFLICT (content_id, vibe_id) DO UPDATE
          SET strength = EXCLUDED.strength
        `, [contentId, vibe.id, vibe.strength]);
      }
    }

    console.log('Movies and shows populated successfully!');
  } catch (error) {
    console.error('Error populating movies and shows:', error);
  }
}

async function populateMusic() {
  try {
    // Get popular tracks from Last.fm
    const response = await lastfmApi.get('/', {
      params: {
        method: 'chart.gettoptracks',
        limit: 100
      }
    });

    const tracks = response.data.tracks.track;

    for (const track of tracks) {
      // Get additional track info
      const trackInfo = await lastfmApi.get('/', {
        params: {
          method: 'track.getInfo',
          artist: track.artist.name,
          track: track.name
        }
      });

      // Insert into database
      const query = `
        INSERT INTO songs (
          title, artist, album, lastfm_id, lastfm_url
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (lastfm_id) DO UPDATE
        SET title = EXCLUDED.title,
            artist = EXCLUDED.artist
        RETURNING id
      `;

      const values = [
        track.name,
        track.artist.name,
        trackInfo.data.track?.album?.title || 'Unknown Album',
        track.mbid || `${track.artist.name}-${track.name}`,
        track.url
      ];

      const result = await db.query(query, values);
      const songId = result.rows[0].id;

      // Analyze song for vibes
      const vibes = detectVibesFromTrack(track, trackInfo.data.track);
      
      // Insert vibes
      for (const vibe of vibes) {
        await db.query(`
          INSERT INTO song_vibes (song_id, vibe_id, strength)
          VALUES ($1, $2, $3)
          ON CONFLICT (song_id, vibe_id) DO UPDATE
          SET strength = EXCLUDED.strength
        `, [songId, vibe.id, vibe.strength]);
      }
    }

    console.log('Music populated successfully!');
  } catch (error) {
    console.error('Error populating music:', error);
  }
}

function detectVibesFromContent(content, details) {
  const vibes = [];
  const genres = details.genres || [];
  const keywords = details.keywords?.keywords || [];
  const vote_average = details.vote_average || 0;
  
  // Genre-based analysis
  genres.forEach(genre => {
    switch (genre.name.toLowerCase()) {
      case 'action':
      case 'adventure':
        vibes.push({ id: 7, strength: 0.9 }); // Avventuroso
        break;
      case 'romance':
        vibes.push({ id: 6, strength: 0.9 }); // Romantico
        break;
      case 'drama':
        vibes.push({ id: 3, strength: 0.8 }); // Nostalgico
        break;
      case 'thriller':
      case 'mystery':
        vibes.push({ id: 8, strength: 0.9 }); // Misterioso
        break;
    }
  });

  // Keyword-based analysis
  keywords.forEach(keyword => {
    switch (keyword.name.toLowerCase()) {
      case 'beach':
      case 'summer':
      case 'vacation':
        vibes.push({ id: 1, strength: 0.8 }); // Tropicale
        break;
      case 'city':
      case 'urban':
      case 'street':
        vibes.push({ id: 2, strength: 0.8 }); // Urbano
        break;
    }
  });

  // Rating-based analysis
  if (vote_average > 7.5) {
    vibes.push({ id: 4, strength: 0.7 }); // Energetico
  } else if (vote_average < 6.0) {
    vibes.push({ id: 5, strength: 0.6 }); // Rilassante
  }

  return vibes;
}

function detectVibesFromTrack(track, details) {
  const vibes = [];
  const tags = details.toptags?.tag || [];

  // Tag-based analysis
  tags.forEach(tag => {
    switch (tag.name.toLowerCase()) {
      case 'summer':
      case 'beach':
      case 'tropical':
        vibes.push({ id: 1, strength: 0.9 }); // Tropicale
        break;
      case 'urban':
      case 'city':
      case 'street':
        vibes.push({ id: 2, strength: 0.9 }); // Urbano
        break;
      case 'nostalgic':
      case 'memories':
      case 'old school':
        vibes.push({ id: 3, strength: 0.9 }); // Nostalgico
        break;
      case 'energetic':
      case 'power':
      case 'upbeat':
        vibes.push({ id: 4, strength: 0.9 }); // Energetico
        break;
      case 'chill':
      case 'relaxing':
      case 'peaceful':
        vibes.push({ id: 5, strength: 0.9 }); // Rilassante
        break;
      case 'romantic':
      case 'love':
      case 'romance':
        vibes.push({ id: 6, strength: 0.9 }); // Romantico
        break;
    }
  });

  return vibes;
}

module.exports = {
  populateMoviesAndShows,
  populateMusic
}; 
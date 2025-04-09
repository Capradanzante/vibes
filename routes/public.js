const express = require('express');
const router = express.Router();
const spotifyApi = require('../config/spotify');

// Definizione delle vibes principali
const VIBES_CATEGORIES = {
  MOOD: {
    HAPPY: { id: '1', name: 'Happy', keywords: ['upbeat', 'cheerful', 'joyful'] },
    SAD: { id: '2', name: 'Sad', keywords: ['melancholic', 'heartbreak', 'emotional'] },
    ENERGETIC: { id: '3', name: 'Energetic', keywords: ['powerful', 'dynamic', 'intense'] },
    CALM: { id: '4', name: 'Calm', keywords: ['peaceful', 'relaxing', 'soothing'] },
    DARK: { id: '5', name: 'Dark', keywords: ['mysterious', 'intense', 'haunting'] }
  },
  GENRE_BASED: {
    EPIC: { id: '6', name: 'Epic', keywords: ['orchestral', 'cinematic', 'dramatic'] },
    ROMANTIC: { id: '7', name: 'Romantic', keywords: ['love', 'passion', 'emotional'] },
    ACTION: { id: '8', name: 'Action', keywords: ['fast', 'intense', 'powerful'] },
    NOSTALGIC: { id: '9', name: 'Nostalgic', keywords: ['retro', 'memories', 'throwback'] }
  },
  SITUATION: {
    PARTY: { id: '10', name: 'Party', keywords: ['fun', 'dance', 'celebration'] },
    ROAD_TRIP: { id: '11', name: 'Road Trip', keywords: ['adventure', 'journey', 'freedom'] },
    DRAMATIC: { id: '12', name: 'Dramatic', keywords: ['emotional', 'intense', 'powerful'] },
    INSPIRATIONAL: { id: '13', name: 'Inspirational', keywords: ['uplifting', 'motivational', 'empowering'] }
  }
};

// Endpoint pubblico per la ricerca
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    // Usa le credenziali dell'applicazione invece di quelle dell'utente
    const clientCredentials = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(clientCredentials.body.access_token);

    // Cerca la traccia
    const results = await spotifyApi.searchTracks(q, { limit: 10 });
    
    // Per ogni traccia, ottieni le caratteristiche audio
    const tracksWithFeatures = await Promise.all(
      results.body.tracks.items.map(async (track) => {
        try {
          const audioFeatures = await spotifyApi.getAudioFeaturesForTrack(track.id);
          const audioAnalysis = await spotifyApi.getAudioAnalysisForTrack(track.id);
          
          return {
            ...track,
            audioFeatures: audioFeatures.body,
            audioAnalysis: audioAnalysis.body,
            vibes: detectVibesFromTrack(track, audioFeatures.body, audioAnalysis.body)
          };
        } catch (error) {
          console.error(`Error getting audio features for track ${track.id}:`, error);
          return {
            ...track,
            vibes: detectVibesFromTrack(track)
          };
        }
      })
    );

    res.json({ tracks: tracksWithFeatures });
  } catch (error) {
    console.error('Error in public search:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint pubblico per ottenere le vibes popolari
router.get('/vibes/popular', async (req, res) => {
  try {
    // Implementa la logica per ottenere le vibes popolari dal tuo database
    const popularVibes = await db.getPopularVibes();
    res.json(popularVibes);
  } catch (error) {
    console.error('Error getting popular vibes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint pubblico per ottenere i contenuti correlati a una vibe
router.get('/vibes/:id/content', async (req, res) => {
  try {
    const { id } = req.params;
    const vibe = Object.values(VIBES_CATEGORIES)
      .flatMap(category => Object.values(category))
      .find(v => v.id === id);

    if (!vibe) {
      return res.status(404).json({ message: 'Vibe not found' });
    }

    // Qui implementeremo la logica per trovare contenuti con vibes simili
    const relatedContent = await findContentByVibe(vibe);
    res.json(relatedContent);
  } catch (error) {
    console.error('Error getting vibe content:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

function detectVibesFromTrack(track, audioFeatures, audioAnalysis) {
  const vibes = new Set();

  // Se non abbiamo le caratteristiche audio, usiamo solo il genere
  if (!audioFeatures) {
    if (track.artists[0]?.genres) {
      const genres = track.artists[0].genres;
      if (genres.some(g => g.includes('rock') || g.includes('metal'))) vibes.add(VIBES_CATEGORIES.MOOD.ENERGETIC);
      if (genres.some(g => g.includes('classical') || g.includes('soundtrack'))) vibes.add(VIBES_CATEGORIES.GENRE_BASED.EPIC);
      if (genres.some(g => g.includes('romantic') || g.includes('love'))) vibes.add(VIBES_CATEGORIES.GENRE_BASED.ROMANTIC);
      return Array.from(vibes);
    }
    return [VIBES_CATEGORIES.MOOD.ENERGETIC]; // Default fallback
  }

  // Analisi basata sulle caratteristiche audio
  const { valence, energy, tempo, danceability } = audioFeatures;

  // Mood based on valence and energy
  if (valence > 0.6 && energy > 0.6) vibes.add(VIBES_CATEGORIES.MOOD.HAPPY);
  if (valence < 0.4) vibes.add(VIBES_CATEGORIES.MOOD.SAD);
  if (energy > 0.7) vibes.add(VIBES_CATEGORIES.MOOD.ENERGETIC);
  if (energy < 0.4 && valence > 0.4) vibes.add(VIBES_CATEGORIES.MOOD.CALM);
  if (energy > 0.6 && valence < 0.4) vibes.add(VIBES_CATEGORIES.MOOD.DARK);

  // Situation based on combination of features
  if (danceability > 0.7 && energy > 0.6) vibes.add(VIBES_CATEGORIES.SITUATION.PARTY);
  if (tempo > 120 && energy > 0.7) vibes.add(VIBES_CATEGORIES.SITUATION.ACTION);
  if (valence > 0.6 && tempo < 100) vibes.add(VIBES_CATEGORIES.SITUATION.NOSTALGIC);
  if (energy > 0.8 || tempo > 140) vibes.add(VIBES_CATEGORIES.GENRE_BASED.EPIC);

  return Array.from(vibes);
}

async function findContentByVibe(vibe) {
  // Qui implementeremo la logica per trovare contenuti basati sulle vibes
  // Per ora restituiamo dei dati di esempio
  return {
    movies: [
      {
        id: 'm1',
        title: 'Example Movie',
        type: 'movie',
        year: 2024,
        poster_path: '/path/to/poster.jpg',
        description: 'A movie that matches the vibe',
        matchScore: 0.85
      }
    ],
    series: [
      {
        id: 's1',
        title: 'Example Series',
        type: 'series',
        year: 2024,
        poster_path: '/path/to/poster.jpg',
        description: 'A series that matches the vibe',
        matchScore: 0.78
      }
    ],
    relatedSongs: [
      {
        id: 'song1',
        name: 'Similar Song',
        artist: 'Artist Name',
        album: {
          name: 'Album Name',
          images: [{ url: '/path/to/image.jpg' }]
        },
        matchScore: 0.92
      }
    ]
  };
}

module.exports = router; 
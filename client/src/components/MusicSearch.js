import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia,
  IconButton,
  InputAdornment,
  Button,
  Chip,
  Divider,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import MovieIcon from '@mui/icons-material/Movie';
import TvIcon from '@mui/icons-material/Tv';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorMessage from './ErrorMessage';
import { useAuth } from '../context/AuthContext';

const MusicSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [relatedContent, setRelatedContent] = useState(null);
  const { isAuthenticated } = useAuth();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSelectedTrack(null);
    setRelatedContent(null);

    try {
      const response = await fetch(`http://localhost:3001/api/public/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Errore nella ricerca');
      
      setSearchResults(data.tracks || []);
    } catch (err) {
      setError('Non siamo riusciti a cercare la musica. Riprova più tardi.');
      console.error('Errore nella ricerca:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSelect = async (track) => {
    setSelectedTrack(track);
    setLoading(true);
    
    try {
      // Ottieni i contenuti correlati basati sulle vibes della traccia
      const vibePromises = track.vibes.map(async (vibe) => {
        const response = await fetch(`http://localhost:3001/api/public/vibes/${vibe.id}/content`);
        if (!response.ok) throw new Error('Failed to fetch related content');
        return response.json();
      });

      const vibeResults = await Promise.all(vibePromises);
      
      // Unisci e deduplicizza i risultati
      const mergedContent = {
        movies: [...new Set(vibeResults.flatMap(r => r.movies))],
        series: [...new Set(vibeResults.flatMap(r => r.series))],
        relatedSongs: [...new Set(vibeResults.flatMap(r => r.relatedSongs))]
      };

      setRelatedContent(mergedContent);
    } catch (err) {
      setError('Errore nel caricamento dei contenuti correlati');
      console.error('Error fetching related content:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = (previewUrl, trackId) => {
    if (playingTrack?.id === trackId) {
      playingTrack.audio.pause();
      setPlayingTrack(null);
    } else {
      if (playingTrack?.audio) {
        playingTrack.audio.pause();
      }
      const audio = new Audio(previewUrl);
      audio.play();
      setPlayingTrack({ id: trackId, audio });
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
          Trova contenuti in base alle tue vibes musicali
        </Typography>
        
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca una canzone, un artista o un album..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton type="submit">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 4 }}
          />
        </form>

        {loading && <LoadingSkeleton count={3} type="wave" />}
        
        {error && (
          <ErrorMessage 
            message={error}
            className="mb-4"
          />
        )}

        <Grid container spacing={4}>
          {/* Colonna sinistra: risultati della ricerca */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Risultati della ricerca
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {searchResults.map((track) => (
                <Card 
                  key={track.id} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    cursor: 'pointer',
                    border: selectedTrack?.id === track.id ? '2px solid primary.main' : 'none'
                  }}
                  onClick={() => handleTrackSelect(track)}
                >
                  <CardMedia
                    component="img"
                    sx={{ width: 100 }}
                    image={track.album.images[0]?.url}
                    alt={track.album.name}
                  />
                  <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
                    <CardContent sx={{ flex: '1 0 auto' }}>
                      <Typography component="div" variant="subtitle1" fontWeight="bold">
                        {track.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {track.artists.map(a => a.name).join(', ')}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {track.vibes?.map((vibe) => (
                          <Chip
                            key={vibe.id}
                            label={vibe.name}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </CardContent>
                    <Box sx={{ pr: 2 }}>
                      {track.preview_url && (
                        <IconButton 
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlay(track.preview_url, track.id);
                          }}
                        >
                          {playingTrack?.id === track.id ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          </Grid>

          {/* Colonna destra: contenuti correlati */}
          <Grid item xs={12} md={6}>
            {selectedTrack && (
              <>
                <Typography variant="h6" gutterBottom>
                  Contenuti con vibes simili
                </Typography>
                {relatedContent ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Film correlati */}
                    {relatedContent.movies.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MovieIcon /> Film
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {relatedContent.movies.map((movie) => (
                            <Card key={movie.id} sx={{ width: 200 }}>
                              <CardMedia
                                component="img"
                                height="300"
                                image={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                alt={movie.title}
                              />
                              <CardContent>
                                <Typography variant="subtitle2" noWrap>
                                  {movie.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {movie.year} • Match: {Math.round(movie.matchScore * 100)}%
                                </Typography>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Serie TV correlate */}
                    {relatedContent.series.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TvIcon /> Serie TV
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {relatedContent.series.map((series) => (
                            <Card key={series.id} sx={{ width: 200 }}>
                              <CardMedia
                                component="img"
                                height="300"
                                image={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
                                alt={series.title}
                              />
                              <CardContent>
                                <Typography variant="subtitle2" noWrap>
                                  {series.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {series.year} • Match: {Math.round(series.matchScore * 100)}%
                                </Typography>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Canzoni correlate */}
                    {relatedContent.relatedSongs.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          Altre canzoni con vibes simili
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {relatedContent.relatedSongs.map((song) => (
                            <Card key={song.id} sx={{ display: 'flex', alignItems: 'center' }}>
                              <CardMedia
                                component="img"
                                sx={{ width: 60 }}
                                image={song.album.images[0]?.url}
                                alt={song.album.name}
                              />
                              <CardContent>
                                <Typography variant="subtitle2">
                                  {song.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {song.artist} • Match: {Math.round(song.matchScore * 100)}%
                                </Typography>
                              </CardContent>
                            </Card>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ) : loading ? (
                  <LoadingSkeleton count={3} type="wave" />
                ) : (
                  <Typography color="text.secondary">
                    Seleziona una canzone per vedere i contenuti correlati
                  </Typography>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default MusicSearch; 
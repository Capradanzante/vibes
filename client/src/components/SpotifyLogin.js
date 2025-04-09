import React, { useEffect, useState } from 'react';
import { Button, Box, Typography, Container, Paper } from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MovieIcon from '@mui/icons-material/Movie';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SpotifyLogin = () => {
  const [authUrl, setAuthUrl] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Controlla se c'è un codice di autorizzazione nell'URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      // Gestisci il callback di Spotify
      fetch(`http://localhost:3001/api/spotify/callback?code=${code}`)
        .then(response => response.json())
        .then(data => {
          login(data.accessToken, data.user);
          navigate('/search');
        })
        .catch(error => console.error('Errore:', error));
    } else {
      // Ottieni l'URL di autenticazione
      fetch('http://localhost:3001/api/spotify/auth')
        .then(response => response.json())
        .then(data => setAuthUrl(data.authUrl))
        .catch(error => console.error('Errore:', error));
    }
  }, [login, navigate]);

  const handleLogin = () => {
    window.location.href = authUrl;
  };

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          backgroundColor: '#1E1E1E',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <MusicNoteIcon sx={{ fontSize: 40, mr: 1, color: '#1DB954' }} />
          <MovieIcon sx={{ fontSize: 40, color: '#E50914' }} />
        </Box>
        <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ color: '#FFFFFF' }}>
          Vibes Matcher
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, color: '#B3B3B3', textAlign: 'center' }}>
          Accedi con Spotify per scoprire film e serie TV che corrispondono alle tue vibes musicali
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<MusicNoteIcon />}
          onClick={handleLogin}
          sx={{
            backgroundColor: '#1DB954',
            '&:hover': {
              backgroundColor: '#1ed760',
            },
            padding: '12px 40px',
            fontSize: '1.2rem',
            borderRadius: '25px',
          }}
        >
          Accedi con Spotify
        </Button>
      </Paper>
    </Container>
  );
};

export default SpotifyLogin; 
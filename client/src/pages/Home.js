import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Paper,
} from '@mui/material';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MovieIcon from '@mui/icons-material/Movie';
import SearchIcon from '@mui/icons-material/Search';
import SpotifyLogin from '../components/SpotifyLogin';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <SpotifyLogin />;
  }

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          pt: 8,
          pb: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          component="h1"
          variant="h2"
          align="center"
          color="text.primary"
          gutterBottom
        >
          Vibes Matcher
        </Typography>
        <Typography
          variant="h5"
          align="center"
          color="text.secondary"
          paragraph
        >
          Trova il film o la serie TV perfetta per la musica che stai ascoltando.
          Scopri come le vibes musicali si collegano alle atmosfere cinematografiche.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<SearchIcon />}
            onClick={() => navigate('/search')}
            sx={{ mr: 2 }}
          >
            Inizia a Cercare
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<MusicNoteIcon />}
            onClick={() => navigate('/vibes')}
          >
            Esplora Vibes
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <MusicNoteIcon sx={{ fontSize: 40, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Musica
            </Typography>
            <Typography align="center">
              Cerca la tua canzone preferita o esplora nuove tracce per trovare
              l'atmosfera perfetta.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <MovieIcon sx={{ fontSize: 40, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Film e Serie TV
            </Typography>
            <Typography align="center">
              Scopri suggerimenti personalizzati di film e serie TV che
              corrispondono alle vibes della tua musica.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <SearchIcon sx={{ fontSize: 40, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Esplora
            </Typography>
            <Typography align="center">
              Naviga tra diverse categorie di vibes e trova nuove combinazioni
              musicali e cinematografiche.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home; 
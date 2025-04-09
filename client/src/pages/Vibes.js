import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

const Vibes = () => {
  const [vibes, setVibes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVibes = async () => {
      try {
        // TODO: Sostituire con la chiamata API reale
        const mockVibes = [
          {
            id: 1,
            name: 'Tropicale',
            description: 'Atmosfera da spiaggia, relax, festa sulla sabbia',
            image: 'https://via.placeholder.com/300x200?text=Tropicale',
          },
          {
            id: 2,
            name: 'Urbano',
            description: 'Atmosfera cittadina, street life, metropolitan vibes',
            image: 'https://via.placeholder.com/300x200?text=Urbano',
          },
          {
            id: 3,
            name: 'Nostalgico',
            description: 'Sensazione di nostalgia, ricordi, momenti del passato',
            image: 'https://via.placeholder.com/300x200?text=Nostalgico',
          },
        ];
        setVibes(mockVibes);
      } catch (err) {
        setError('Errore nel caricamento delle vibes');
        console.error('Errore:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVibes();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" sx={{ mt: 4 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Esplora le Vibes
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Scopri le diverse atmosfere musicali e trova i film e le serie TV
          perfette per ogni mood.
        </Typography>

        <Grid container spacing={4}>
          {vibes.map((vibe) => (
            <Grid item xs={12} sm={6} md={4} key={vibe.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    transition: 'transform 0.2s ease-in-out',
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={vibe.image}
                  alt={vibe.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {vibe.name}
                  </Typography>
                  <Typography>{vibe.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default Vibes; 
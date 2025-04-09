import React from 'react';
import { Box, Typography, Container } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="sm">
        <Typography variant="body1" align="center">
          Vibes Matcher - Trova il film perfetto per la tua musica
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary">
          © {new Date().getFullYear()} Vibes Matcher
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 
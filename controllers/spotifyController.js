const SpotifyWebApi = require('spotify-web-api-node');
const dotenv = require('dotenv');
dotenv.config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Genera l'URL per l'autenticazione
const getAuthUrl = (req, res) => {
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'playlist-read-private',
    'user-read-recently-played'
  ];
  
  const state = generateRandomString(16);
  const authUrl = spotifyApi.createAuthorizeURL(scopes, state);
  
  res.json({ authUrl });
};

// Gestisce il callback dopo l'autenticazione
const handleCallback = async (req, res) => {
  const { code } = req.query;
  
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token } = data.body;
    
    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);
    
    const userData = await spotifyApi.getMe();
    
    res.json({
      accessToken: access_token,
      refreshToken: refresh_token,
      user: userData.body
    });
  } catch (error) {
    console.error('Errore durante l\'autenticazione:', error);
    res.status(500).json({ error: 'Errore durante l\'autenticazione' });
  }
};

// Funzione di utilità per generare stringhe casuali
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Funzione per la ricerca di brani
const searchTracks = async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query di ricerca mancante' });
  }

  try {
    const data = await spotifyApi.searchTracks(q, { limit: 10 });
    res.json({ tracks: data.body.tracks.items });
  } catch (error) {
    console.error('Errore durante la ricerca:', error);
    res.status(500).json({ error: 'Errore durante la ricerca' });
  }
};

module.exports = {
  getAuthUrl,
  handleCallback,
  searchTracks
}; 
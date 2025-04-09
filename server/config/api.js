const axios = require('axios');
const SpotifyWebApi = require('spotify-web-api-node');

// TMDB API Configuration
const tmdbApi = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: process.env.TMDB_API_KEY,
    language: 'it-IT'
  }
});

// Spotify API Configuration
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Last.fm API Configuration
const lastfmApi = axios.create({
  baseURL: 'http://ws.audioscrobbler.com/2.0/',
  params: {
    api_key: process.env.LASTFM_API_KEY,
    format: 'json'
  }
});

module.exports = {
  tmdbApi,
  spotifyApi,
  lastfmApi
}; 
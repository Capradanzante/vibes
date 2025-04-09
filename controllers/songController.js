const Song = require('../models/Song');

const getAllSongs = async (req, res) => {
  try {
    const songs = await Song.getAll();
    res.json(songs);
  } catch (error) {
    console.error('Errore nel recupero delle canzoni:', error);
    res.status(500).json({ error: 'Errore nel recupero delle canzoni' });
  }
};

const createSong = async (req, res) => {
  try {
    const song = await Song.create(req.body);
    res.status(201).json(song);
  } catch (error) {
    console.error('Errore nella creazione della canzone:', error);
    res.status(500).json({ error: 'Errore nella creazione della canzone' });
  }
};

module.exports = {
  getAllSongs,
  createSong
}; 
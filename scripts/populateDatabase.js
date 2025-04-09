const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vibes',
  password: process.env.DB_PASSWORD || 'safaribensani',
  port: process.env.DB_PORT || 5432,
});

async function populateDatabase() {
  const client = await pool.connect();
  try {
    // Inserimento di utenti di esempio
    await client.query(`
      INSERT INTO users (id, email, username, password_hash, role)
      VALUES 
        (uuid_generate_v4(), 'admin@vibes.com', 'admin', '$2b$10$X7X5X3X1X9X7X5X3X1X9X7X5X3X1X9X7X5X3X1X9X7X5X3X1X9', 'admin'),
        (uuid_generate_v4(), 'user@vibes.com', 'user', '$2b$10$X7X5X3X1X9X7X5X3X1X9X7X5X3X1X9X7X5X3X1X9X7X5X3X1X9', 'user')
      ON CONFLICT (email) DO NOTHING;
    `);

    // Inserimento di contenuti di esempio
    await client.query(`
      INSERT INTO content (id, title, type, release_year, description, poster_url)
      VALUES 
        (uuid_generate_v4(), 'Inception', 'movie', 2010, 'Un ladro che ruba segreti aziendali attraverso l''uso della tecnologia di condivisione dei sogni.', 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg'),
        (uuid_generate_v4(), 'Stranger Things', 'series', 2016, 'Quando un ragazzo scompare, una piccola città scopre un mistero che coinvolge esperimenti segreti, forze soprannaturali e una strana bambina.', 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg')
      ON CONFLICT DO NOTHING;
    `);

    // Inserimento di canzoni di esempio
    await client.query(`
      INSERT INTO songs (id, title, artist, album, duration, release_year)
      VALUES 
        (uuid_generate_v4(), 'Bohemian Rhapsody', 'Queen', 'A Night at the Opera', 354, 1975),
        (uuid_generate_v4(), 'Stairway to Heaven', 'Led Zeppelin', 'Led Zeppelin IV', 482, 1971)
      ON CONFLICT DO NOTHING;
    `);

    // Associazione di vibes ai contenuti
    await client.query(`
      WITH content_ids AS (
        SELECT id FROM content WHERE title IN ('Inception', 'Stranger Things')
      ),
      vibe_ids AS (
        SELECT id FROM vibes WHERE name IN ('Misterioso', 'Avventuroso')
      )
      INSERT INTO content_vibes (content_id, vibe_id, intensity, confidence_score)
      SELECT 
        c.id,
        v.id,
        0.8,
        0.9
      FROM content_ids c
      CROSS JOIN vibe_ids v
      ON CONFLICT DO NOTHING;
    `);

    // Associazione di vibes alle canzoni
    await client.query(`
      WITH song_ids AS (
        SELECT id FROM songs WHERE title IN ('Bohemian Rhapsody', 'Stairway to Heaven')
      ),
      vibe_ids AS (
        SELECT id FROM vibes WHERE name IN ('Energetico', 'Nostalgico')
      )
      INSERT INTO song_vibes (song_id, vibe_id, intensity, confidence_score)
      SELECT 
        s.id,
        v.id,
        0.9,
        0.95
      FROM song_ids s
      CROSS JOIN vibe_ids v
      ON CONFLICT DO NOTHING;
    `);

    console.log('Database popolato con successo');
  } catch (error) {
    console.error('Errore durante il popolamento del database:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
}

// Esegui il popolamento
populateDatabase()
  .then(() => {
    console.log('Popolamento completato con successo');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Errore durante il popolamento:', error);
    process.exit(1);
  }); 
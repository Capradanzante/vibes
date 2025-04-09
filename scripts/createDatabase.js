const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const defaultPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'safaribensani',
  port: process.env.DB_PORT || 5432,
});

async function createDatabase() {
  const client = await defaultPool.connect();
  try {
    // Crea il database se non esiste
    await client.query('CREATE DATABASE vibes');
    console.log('Database "vibes" creato con successo');
  } catch (error) {
    if (error.code === '42P04') {
      console.log('Il database "vibes" esiste già');
    } else {
      console.error('Errore nella creazione del database:', error);
      throw error;
    }
  } finally {
    client.release();
    await defaultPool.end();
  }
}

async function setupDatabase() {
  // Create a new pool connected to the vibes database
  const vibesPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    password: process.env.DB_PASSWORD || 'safaribensani',
    port: process.env.DB_PORT || 5432,
    database: 'vibes'
  });

  const client = await vibesPool.connect();
  try {
    // Check if types exist
    const typeCheckQuery = `
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'media_type'
      ) as media_type_exists,
      EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'vibe_category'
      ) as vibe_category_exists,
      EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'vibe_source'
      ) as vibe_source_exists,
      EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role'
      ) as user_role_exists
    `;
    
    const typeCheckResult = await client.query(typeCheckQuery);
    const { media_type_exists, vibe_category_exists, vibe_source_exists, user_role_exists } = typeCheckResult.rows[0];

    // Leggi lo schema SQL
    const schemaPath = path.join(__dirname, 'database.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Remove type creation if they already exist
    if (media_type_exists) {
      schema = schema.replace(/CREATE TYPE media_type AS ENUM.*?;/g, '');
    }
    if (vibe_category_exists) {
      schema = schema.replace(/CREATE TYPE vibe_category AS ENUM.*?;/g, '');
    }
    if (vibe_source_exists) {
      schema = schema.replace(/CREATE TYPE vibe_source AS ENUM.*?;/g, '');
    }
    if (user_role_exists) {
      schema = schema.replace(/CREATE TYPE user_role AS ENUM.*?;/g, '');
    }
    
    await client.query(schema);
    console.log('Schema del database creato con successo');
  } catch (error) {
    console.error('Errore nella creazione dello schema:', error);
    throw error;
  } finally {
    client.release();
    await vibesPool.end();
  }
}

// Esegui le funzioni in sequenza
createDatabase()
  .then(() => setupDatabase())
  .then(() => {
    console.log('Setup del database completato con successo');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Errore durante il setup del database:', error);
    process.exit(1);
  }); 
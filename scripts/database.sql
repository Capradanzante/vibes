-- Elimina le tabelle se esistono già (per evitare conflitti)
DROP TABLE IF EXISTS song_vibes, content_vibes, songs, content, vibes, users, refresh_tokens, login_attempts CASCADE;

-- Estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Tipi personalizzati
CREATE TYPE media_type AS ENUM ('movie', 'series');
CREATE TYPE vibe_category AS ENUM ('mood', 'genre', 'setting', 'theme', 'atmosphere');
CREATE TYPE vibe_source AS ENUM ('user', 'system', 'analysis');
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');

-- Tabella degli utenti
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    avatar_url VARCHAR(255),
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabella delle vibes/atmosfere
CREATE TABLE vibes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    category vibe_category NOT NULL,
    intensity SMALLINT NOT NULL,
    color VARCHAR(7),
    icon VARCHAR(50),
    attributes JSONB DEFAULT '{}',
    parent_vibe_id UUID REFERENCES vibes(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_intensity CHECK (intensity BETWEEN 1 AND 10)
);

-- Tabella dei contenuti multimediali
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tmdb_id VARCHAR(20) UNIQUE,
    imdb_id VARCHAR(20) UNIQUE,
    title VARCHAR(255) NOT NULL,
    normalized_title VARCHAR(255) GENERATED ALWAYS AS (lower(title)) STORED,
    original_title VARCHAR(255),
    type media_type NOT NULL,
    release_year INT,
    release_date DATE,
    duration INT,
    description TEXT,
    tagline VARCHAR(500),
    poster_url VARCHAR(255),
    backdrop_url VARCHAR(255),
    popularity DECIMAL(10,2) DEFAULT 0,
    rating DECIMAL(3,1),
    vote_count INT DEFAULT 0,
    meta_tags JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_year CHECK (release_year BETWEEN 1888 AND EXTRACT(YEAR FROM CURRENT_DATE) + 5),
    CONSTRAINT chk_rating CHECK (rating BETWEEN 0 AND 10),
    CONSTRAINT chk_vote_count CHECK (vote_count >= 0)
);

-- Tabella delle canzoni
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spotify_id VARCHAR(50) UNIQUE,
    isrc VARCHAR(12),
    title VARCHAR(255) NOT NULL,
    normalized_title VARCHAR(255) GENERATED ALWAYS AS (lower(title)) STORED,
    artist VARCHAR(255) NOT NULL,
    album VARCHAR(255),
    duration INT NOT NULL,
    release_year SMALLINT,
    explicit BOOLEAN DEFAULT false,
    preview_url VARCHAR(255),
    spotify_url VARCHAR(255),
    audio_features JSONB DEFAULT '{}',
    meta_tags JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_duration CHECK (duration > 0),
    CONSTRAINT chk_year_song CHECK (release_year BETWEEN 1888 AND EXTRACT(YEAR FROM CURRENT_DATE) + 1)
);

-- Tabella di mappatura tra canzoni e vibes
CREATE TABLE song_vibes (
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    vibe_id UUID REFERENCES vibes(id) ON DELETE CASCADE,
    intensity DECIMAL(3,2) NOT NULL,
    confidence_score DECIMAL(3,2),
    source vibe_source NOT NULL DEFAULT 'system',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (song_id, vibe_id),
    CONSTRAINT chk_intensity_song_vibe CHECK (intensity BETWEEN 0 AND 1),
    CONSTRAINT chk_confidence_song_vibe CHECK (confidence_score BETWEEN 0 AND 1)
);

-- Tabella di mappatura tra contenuti e vibes
CREATE TABLE content_vibes (
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    vibe_id UUID REFERENCES vibes(id) ON DELETE CASCADE,
    intensity DECIMAL(3,2) NOT NULL,
    confidence_score DECIMAL(3,2),
    source vibe_source NOT NULL DEFAULT 'system',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (content_id, vibe_id),
    CONSTRAINT chk_intensity_content_vibe CHECK (intensity BETWEEN 0 AND 1),
    CONSTRAINT chk_confidence_content_vibe CHECK (confidence_score BETWEEN 0 AND 1)
);

-- Tabella per i token di refresh
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabella per i tentativi di login
CREATE TABLE login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indici per ottimizzare le ricerche
CREATE INDEX idx_content_search ON content USING gin (to_tsvector('italian', title || ' ' || COALESCE(original_title, '') || ' ' || COALESCE(description, '')));
CREATE INDEX idx_songs_search ON songs USING gin (to_tsvector('italian', title || ' ' || artist || ' ' || COALESCE(album, '')));
CREATE INDEX idx_content_normalized_title ON content(normalized_title);
CREATE INDEX idx_songs_normalized_title ON songs(normalized_title);
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_release_year ON content(release_year);
CREATE INDEX idx_songs_release_year ON songs(release_year);
CREATE INDEX idx_content_popularity ON content(popularity DESC);
CREATE INDEX idx_content_rating ON content(rating DESC);
CREATE INDEX idx_content_meta ON content USING gin(meta_tags);
CREATE INDEX idx_songs_meta ON songs USING gin(meta_tags);
CREATE INDEX idx_songs_audio_features ON songs USING gin(audio_features);
CREATE INDEX idx_vibes_category ON vibes(category);
CREATE INDEX idx_vibes_intensity ON vibes(intensity);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vibes_updated_at
    BEFORE UPDATE ON vibes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_songs_updated_at
    BEFORE UPDATE ON songs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserimento di alcune vibes di esempio
INSERT INTO vibes (name, slug, description, category, intensity, color, icon) VALUES
('Tropicale', 'tropical', 'Atmosfera da spiaggia, relax, festa sulla sabbia', 'atmosphere', 7, '#FFD700', 'palm-tree'),
('Urbano', 'urban', 'Atmosfera cittadina, street life, metropolitan vibes', 'setting', 8, '#808080', 'city'),
('Nostalgico', 'nostalgic', 'Sensazione di nostalgia, ricordi, momenti del passato', 'mood', 5, '#B8860B', 'clock-rotate-left'),
('Energetico', 'energetic', 'Pieno di energia, motivante, power mood', 'mood', 9, '#FF4500', 'bolt'),
('Rilassante', 'relaxing', 'Calmo, peaceful, momento di relax', 'mood', 3, '#87CEEB', 'cloud'),
('Romantico', 'romantic', 'Atmosfera romantica, love mood, sentimentale', 'mood', 6, '#FF69B4', 'heart'),
('Avventuroso', 'adventurous', 'Senso di avventura, esplorazione, scoperta', 'theme', 8, '#228B22', 'compass'),
('Misterioso', 'mysterious', 'Atmosfera di mistero, suspense, intrigante', 'atmosphere', 7, '#483D8B', 'question')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description,
    category = EXCLUDED.category,
    intensity = EXCLUDED.intensity,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon;

-- Inserimento di alcune canzoni di esempio
INSERT INTO songs (title, artist, album, duration, release_year) VALUES
('Summer Vibes', 'DJ Beach', 'Tropical Beats', 180, 2023),
('City Lights', 'Urban Soul', 'Metropolitan', 210, 2023),
('Remember When', 'The Nostalgics', 'Memories', 195, 2022),
('Power Up', 'Energy Band', 'Motivation', 165, 2023),
('Peaceful Mind', 'Zen Masters', 'Relaxation', 300, 2023),
('Love Story', 'Romance', 'Heart & Soul', 240, 2022),
('Adventure Time', 'Explorers', 'Discovery', 185, 2023),
('Mystery Night', 'Dark Mood', 'Enigma', 225, 2023)
ON CONFLICT DO NOTHING;

-- Inserimento di alcuni contenuti di esempio
INSERT INTO content (title, type, description) VALUES
('Tropical Paradise', 'movie', 'Un film ambientato su un''isola tropicale'),
('City Life', 'series', 'Una serie TV sulla vita in città'),
('Memories of Yesterday', 'movie', 'Un film nostalgico sul passato'),
('Power Rangers', 'series', 'Una serie TV piena di azione ed energia'),
('Zen Garden', 'movie', 'Un film rilassante sulla meditazione'),
('Love in Paris', 'movie', 'Una storia d''amore romantica'),
('Adventure Quest', 'series', 'Una serie TV di avventura'),
('Mystery Manor', 'series', 'Una serie TV misteriosa')
ON CONFLICT DO NOTHING;

-- Collegamento tra canzoni e vibes
INSERT INTO song_vibes (song_id, vibe_id, intensity, confidence_score)
SELECT s.id, v.id, 
  CASE 
    WHEN s.title = 'Summer Vibes' AND v.name = 'Tropicale' THEN 0.9
    WHEN s.title = 'Summer Vibes' AND v.name = 'Energetico' THEN 0.7
    WHEN s.title = 'City Lights' AND v.name = 'Urbano' THEN 0.8
    WHEN s.title = 'City Lights' AND v.name = 'Nostalgico' THEN 0.6
    WHEN s.title = 'Remember When' AND v.name = 'Nostalgico' THEN 0.9
    WHEN s.title = 'Remember When' AND v.name = 'Rilassante' THEN 0.5
    WHEN s.title = 'Power Up' AND v.name = 'Energetico' THEN 0.9
    WHEN s.title = 'Power Up' AND v.name = 'Urbano' THEN 0.6
    WHEN s.title = 'Peaceful Mind' AND v.name = 'Rilassante' THEN 0.9
    WHEN s.title = 'Peaceful Mind' AND v.name = 'Misterioso' THEN 0.4
    WHEN s.title = 'Love Story' AND v.name = 'Romantico' THEN 0.9
    WHEN s.title = 'Love Story' AND v.name = 'Nostalgico' THEN 0.7
    WHEN s.title = 'Adventure Time' AND v.name = 'Avventuroso' THEN 0.8
    WHEN s.title = 'Adventure Time' AND v.name = 'Energetico' THEN 0.7
    WHEN s.title = 'Mystery Night' AND v.name = 'Misterioso' THEN 0.9
    WHEN s.title = 'Mystery Night' AND v.name = 'Nostalgico' THEN 0.5
  END AS intensity,
  0.8 AS confidence_score
FROM songs s
CROSS JOIN vibes v
WHERE 
    (s.title = 'Summer Vibes' AND v.name IN ('Tropicale', 'Energetico')) OR
    (s.title = 'City Lights' AND v.name IN ('Urbano', 'Nostalgico')) OR
    (s.title = 'Remember When' AND v.name IN ('Nostalgico', 'Rilassante')) OR
    (s.title = 'Power Up' AND v.name IN ('Energetico', 'Urbano')) OR
    (s.title = 'Peaceful Mind' AND v.name IN ('Rilassante', 'Misterioso')) OR
    (s.title = 'Love Story' AND v.name IN ('Romantico', 'Nostalgico')) OR
    (s.title = 'Adventure Time' AND v.name IN ('Avventuroso', 'Energetico')) OR
    (s.title = 'Mystery Night' AND v.name IN ('Misterioso', 'Nostalgico'))
ON CONFLICT DO NOTHING;

-- Collegamento tra contenuti e vibes
INSERT INTO content_vibes (content_id, vibe_id, intensity, confidence_score)
SELECT c.id, v.id,
  CASE 
    WHEN c.title = 'Tropical Paradise' AND v.name = 'Tropicale' THEN 0.9
    WHEN c.title = 'Tropical Paradise' AND v.name = 'Rilassante' THEN 0.7
    WHEN c.title = 'City Life' AND v.name = 'Urbano' THEN 0.9
    WHEN c.title = 'City Life' AND v.name = 'Energetico' THEN 0.6
    WHEN c.title = 'Memories of Yesterday' AND v.name = 'Nostalgico' THEN 0.9
    WHEN c.title = 'Memories of Yesterday' AND v.name = 'Romantico' THEN 0.5
    WHEN c.title = 'Power Rangers' AND v.name = 'Energetico' THEN 0.9
    WHEN c.title = 'Power Rangers' AND v.name = 'Avventuroso' THEN 0.8
    WHEN c.title = 'Zen Garden' AND v.name = 'Rilassante' THEN 0.9
    WHEN c.title = 'Zen Garden' AND v.name = 'Misterioso' THEN 0.4
    WHEN c.title = 'Love in Paris' AND v.name = 'Romantico' THEN 0.9
    WHEN c.title = 'Love in Paris' AND v.name = 'Nostalgico' THEN 0.6
    WHEN c.title = 'Adventure Quest' AND v.name = 'Avventuroso' THEN 0.9
    WHEN c.title = 'Adventure Quest' AND v.name = 'Energetico' THEN 0.7
    WHEN c.title = 'Mystery Manor' AND v.name = 'Misterioso' THEN 0.9
    WHEN c.title = 'Mystery Manor' AND v.name = 'Nostalgico' THEN 0.5
  END AS intensity,
  0.8 AS confidence_score
FROM content c
CROSS JOIN vibes v
WHERE 
    (c.title = 'Tropical Paradise' AND v.name IN ('Tropicale', 'Rilassante')) OR
    (c.title = 'City Life' AND v.name IN ('Urbano', 'Energetico')) OR
    (c.title = 'Memories of Yesterday' AND v.name IN ('Nostalgico', 'Romantico')) OR
    (c.title = 'Power Rangers' AND v.name IN ('Energetico', 'Avventuroso')) OR
    (c.title = 'Zen Garden' AND v.name IN ('Rilassante', 'Misterioso')) OR
    (c.title = 'Love in Paris' AND v.name IN ('Romantico', 'Nostalgico')) OR
    (c.title = 'Adventure Quest' AND v.name IN ('Avventuroso', 'Energetico')) OR
    (c.title = 'Mystery Manor' AND v.name IN ('Misterioso', 'Nostalgico'))
ON CONFLICT DO NOTHING;

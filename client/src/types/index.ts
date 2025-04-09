// Interfaccia per le Vibes
export interface Vibe {
  id: string;
  name: string;
  description?: string;
}

// Interfaccia per le Canzoni
export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  release_year?: number;
  spotify_id?: string;
  spotify_url?: string;
  apple_music_url?: string;
  lastfm_id?: string;
  lastfm_url?: string;
  created_at?: string;
  vibes: Vibe[];
}

// Interfaccia per Film e Serie TV
export interface MovieShow {
  id: number;
  title: string;
  type: 'movie' | 'tv_show';
  release_year?: number;
  director?: string;
  description?: string;
  poster_url?: string;
  tmdb_id?: string;
  created_at?: string;
}

// Interfaccia per i Link di Streaming
export interface StreamingLink {
  id: number;
  platform: string;
  url: string;
}

// Interfaccia per le risposte API
export interface SearchResult {
  type: 'song' | 'content';
  item: Song | Content;
}

export interface Content {
  id: string;
  title: string;
  type: 'movie' | 'series';
  description?: string;
  vibes: Vibe[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
} 
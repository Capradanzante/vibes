import axios from 'axios';
import { ApiResponse, Vibe, Song, Content } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Crea l'istanza di axios con la configurazione base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API per le Vibes
export const vibesApi = {
  getAll: () => api.get<ApiResponse<Vibe[]>>('/vibes').then(res => res.data),
  getById: (id: string) => api.get<ApiResponse<Vibe>>(`/vibes/${id}`).then(res => res.data),
  getPopular: (limit = 8) => api.get<ApiResponse<Vibe[]>>(`/vibes/popular?limit=${limit}`).then(res => res.data),
};

// API per le Canzoni
export const songsApi = {
  getAll: () => api.get<ApiResponse<Song[]>>('/songs').then(res => res.data),
  getById: (id: string) => api.get<ApiResponse<Song>>(`/songs/${id}`).then(res => res.data),
  getByVibe: (vibeId: string) => api.get<ApiResponse<Song[]>>(`/songs/by-vibe/${vibeId}`).then(res => res.data),
  getRecent: (limit = 6) => api.get<ApiResponse<Song[]>>(`/songs/recent?limit=${limit}`).then(res => res.data),
};

// API per Film e Serie TV
export const contentApi = {
  getAll: (type?: 'movie' | 'series') => 
    api.get<ApiResponse<Content[]>>('/content', { params: { type } }).then(res => res.data),
  getById: (id: string) => api.get<ApiResponse<Content>>(`/content/${id}`).then(res => res.data),
  getByVibe: (vibeId: string) => api.get<ApiResponse<Content[]>>(`/content/by-vibe/${vibeId}`).then(res => res.data),
  getRecent: (limit = 6) => api.get<ApiResponse<Content[]>>(`/content/recent?limit=${limit}`).then(res => res.data),
};
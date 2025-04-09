import React, { useState } from 'react';
import { SearchResult } from '../types';

interface SearchBarProps {
  onSearch: (results: SearchResult[]) => void;
  onError: (message: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onError, onLoadingChange }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    onLoadingChange(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la ricerca');
      }
      
      onSearch(data.data);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Errore durante la ricerca');
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per vibes, canzoni o contenuti..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Cerca
        </button>
      </div>
    </form>
  );
};

export default SearchBar; 
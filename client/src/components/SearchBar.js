import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SearchBar.css';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`http://localhost:3001/api/search?q=${encodeURIComponent(query)}`);
        setResults(response.data);
      } catch (err) {
        setError('Errore durante la ricerca');
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div className="search-container">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Cerca film, serie TV o canzoni..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        {loading && <div className="loading-spinner"></div>}
      </div>

      {error && <div className="error-message">{error}</div>}

      {results.length > 0 && (
        <div className="search-results">
          {results.map((result) => (
            <div key={result.id} className="search-result-item">
              {result.type === 'movie' && (
                <div className="movie-result">
                  <img src={result.poster_url} alt={result.title} className="poster" />
                  <div className="result-info">
                    <h3>{result.title}</h3>
                    <p>{result.release_year}</p>
                    <div className="vibes">
                      {result.vibes.map((vibe) => (
                        <span key={vibe.id} className="vibe-tag">{vibe.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {result.type === 'tv_show' && (
                <div className="tv-show-result">
                  <img src={result.poster_url} alt={result.title} className="poster" />
                  <div className="result-info">
                    <h3>{result.title}</h3>
                    <p>{result.release_year}</p>
                    <div className="vibes">
                      {result.vibes.map((vibe) => (
                        <span key={vibe.id} className="vibe-tag">{vibe.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {result.type === 'song' && (
                <div className="song-result">
                  <div className="result-info">
                    <h3>{result.title}</h3>
                    <p>{result.artist}</p>
                    <div className="vibes">
                      {result.vibes.map((vibe) => (
                        <span key={vibe.id} className="vibe-tag">{vibe.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 
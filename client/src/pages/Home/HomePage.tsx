import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Vibe, Song, Content, SearchResult } from '../../types';
import { vibesApi, songsApi, contentApi } from '../../services/api';
import SearchBar from '../../components/SearchBar';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import ErrorMessage from '../../components/ErrorMessage';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [popularVibes, setPopularVibes] = useState<Vibe[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [recentContent, setRecentContent] = useState<Content[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vibesRes, songsRes, contentRes] = await Promise.all([
        vibesApi.getPopular(),
        songsApi.getRecent(),
        contentApi.getRecent()
      ]);
      setPopularVibes(vibesRes.data);
      setRecentSongs(songsRes.data);
      setRecentContent(contentRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (results: SearchResult[]) => {
    setSearchResults(results);
    setError(null);
  };

  const handleError = (message: string) => {
    setError(message);
    setSearchResults([]);
  };

  const handleLoadingChange = (isLoading: boolean) => {
    setLoading(isLoading);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Vibes Matcher</h1>
      
      <SearchBar
        onSearch={handleSearch}
        onError={handleError}
        onLoadingChange={handleLoadingChange}
      />

      {error && (
        <ErrorMessage message={error} className="mt-8" />
      )}

      {searchResults.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchResults.map((result) => (
            <div key={result.item.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-2">
                {result.item.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {result.type === 'song' 
                  ? `Artista: ${(result.item as Song).artist}`
                  : `Tipo: ${(result.item as Content).type}`
                }
              </p>
              <div className="flex flex-wrap gap-2">
                {result.item.vibes.map((vibe) => (
                  <span
                    key={vibe.id}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {vibe.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Vibes Popolari</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {popularVibes.map((vibe) => (
                <Link
                  key={vibe.id}
                  to={`/vibes/${vibe.id}`}
                  className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold">{vibe.name}</h3>
                  {vibe.description && (
                    <p className="text-sm text-gray-600 mt-1">{vibe.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Canzoni Recenti</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentSongs.map((song) => (
                <div key={song.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold">{song.title}</h3>
                  <p className="text-gray-600 mt-1">{song.artist}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {song.vibes.map((vibe) => (
                      <span
                        key={vibe.id}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {vibe.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Contenuti Recenti</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentContent.map((content) => (
                <div key={content.id} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-semibold">{content.title}</h3>
                  <p className="text-gray-600 mt-1">{content.type}</p>
                  {content.description && (
                    <p className="text-sm text-gray-600 mt-2">{content.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {content.vibes.map((vibe) => (
                      <span
                        key={vibe.id}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {vibe.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default HomePage; 
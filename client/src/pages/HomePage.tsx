import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Vibe, Song, Content } from '../types';
import { vibesApi, songsApi, contentApi } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorMessage from '../components/ErrorMessage';

// Loading skeleton components
const VibeSkeleton = () => (
  <div className="p-4 bg-white rounded-lg shadow animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
  </div>
);

const HomePage = () => {
  const [popularVibes, setPopularVibes] = useState<Vibe[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [recentContent, setRecentContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vibes, songs, content] = await Promise.all([
        vibesApi.getPopular(),
        songsApi.getRecent(),
        contentApi.getRecent()
      ]);
      setPopularVibes(vibes.data);
      setRecentSongs(songs.data);
      setRecentContent(content.data);
    } catch (err) {
      setError('Errore nel caricamento dei dati. Riprova più tardi.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Oops!</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">Discover Your Perfect Vibe</h1>
            <p className="text-xl mb-8">
              Connect with music, movies, and TV shows that match your mood.
              Create and share your unique vibes with the world.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/explore"
                className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Explore Vibes
              </Link>
              <Link
                to="/create"
                className="px-8 py-3 bg-transparent border-2 border-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Create Vibe
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Vibes Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Vibes Popolari</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <VibeSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorMessage message={error} className="mb-4" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularVibes.map((vibe) => (
              <Link
                key={vibe.id}
                to={`/vibes/${vibe.id}`}
                className="p-4 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{vibe.name}</h3>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Content Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Contenuti Recenti</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <VibeSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorMessage message={error} className="mb-4" />
        ) : (
          <div className="space-y-8">
            {/* Recent Songs */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Canzoni</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentSongs.map((song) => (
                  <div key={song.id} className="p-4 bg-white rounded-lg shadow">
                    <h4 className="font-semibold">{song.title}</h4>
                    <p className="text-gray-600">{song.artist}</p>
                    <div className="flex gap-2 mt-2">
                      {song.vibes.map((vibe) => (
                        <span
                          key={vibe.id}
                          className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                        >
                          {vibe.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Movies/Series */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Film e Serie TV</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentContent.map((content) => (
                  <div key={content.id} className="p-4 bg-white rounded-lg shadow">
                    <h4 className="font-semibold">{content.title}</h4>
                    <p className="text-gray-600">
                      {content.type === 'movie' ? 'Film' : 'Serie TV'}
                    </p>
                    {content.vibes && (
                      <div className="flex gap-2 mt-2">
                        {content.vibes.map((vibe) => (
                          <span
                            key={vibe.id}
                            className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                          >
                            {vibe.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage; 
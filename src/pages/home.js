
import React, { useState, useEffect } from 'react';

// Home Component - Completely rebuilt with trending movies and hero section
const Home = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingMovies();
  }, []);

  const fetchTrendingMovies = async () => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=edb25027eda51739f1898a8064bd3f67`
      );
      const data = await response.json();
      setTrendingMovies(data.results?.slice(0, 8) || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <div className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            MovieNote
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Discover, track, and organize your favorite movies
          </p>

        </div>
      </div>

      {/* Trending Movies Section */}
      <div className="px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Trending This Week
          </h2>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-400"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
              {trendingMovies.map((movie) => (
                <div key={movie.id} className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 group-hover:scale-105">
                    {movie.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full h-80 object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                          {movie.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <span>⭐ {movie.vote_average?.toFixed(1)}</span>
                          <span>📅 {movie.release_date?.split('-')[0]}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feature Cards Section */}
      <div className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            ✨ What You Can Do
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-3">Search Movies</h3>
              <p className="text-gray-300">Discover movies with advanced search and sorting options</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-white mb-3">Create Lists</h3>
              <p className="text-gray-300">Build your personal watchlist and track your favorites</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-3">Track Progress</h3>
              <p className="text-gray-300">See ratings, release dates, and organize by preferences</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home
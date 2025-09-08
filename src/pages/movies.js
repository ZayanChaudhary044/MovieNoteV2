import React, { useState } from 'react';

// Enhanced Movies Component with better styling
const Movies = ({ addToList = () => {} }) => {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [sortOption, setSortOption] = useState('popularity.desc');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    if (movies.length > 0) {
      const sorted = sortMovies(movies, e.target.value);
      setMovies(sorted);
    }
  };

  const searchMovies = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=edb25027eda51739f1898a8064bd3f67&query=${query}`
      );
      const data = await response.json();
      const sortedMovies = sortMovies(data.results || [], sortOption);
      setMovies(sortedMovies);
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
    setLoading(false);
  };

  const sortMovies = (movies, sortOption) => {
    const sortedMovies = [...movies];
    switch (sortOption) {
      case 'popularity.desc':
        return sortedMovies.sort((a, b) => b.popularity - a.popularity);
      case 'popularity.asc':
        return sortedMovies.sort((a, b) => a.popularity - b.popularity);
      case 'release_date.desc':
        return sortedMovies.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
      case 'release_date.asc':
        return sortedMovies.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
      case 'alphabet.desc':
        return sortedMovies.sort((a, b) => b.title.localeCompare(a.title));
      case 'alphabet.asc':
        return sortedMovies.sort((a, b) => a.title.localeCompare(b.title));
      case 'vote_average.desc':
        return sortedMovies.sort((a, b) => b.vote_average - a.vote_average);
      case 'vote_average.asc':
        return sortedMovies.sort((a, b) => a.vote_average - b.vote_average);
      default:
        return sortedMovies;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchMovies();
    }
  };

  const handleAddToList = (movie) => {
    addToList(movie);
    setNotification(`${movie.title} added to your list!`);
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
            ✅ {notification}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎬 Movie Search</h1>
          <p className="text-gray-400">Discover your next favorite movie</p>
        </div>

        {/* Search Controls */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={query}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="Search for movies..."
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
              />
            </div>
            <button
              onClick={searchMovies}
              disabled={!query.trim() || loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </span>
              ) : 'Search'}
            </button>
          </div>
          
          {/* Sort Options */}
          <div className="mt-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Sort by:
            </label>
            <select
              value={sortOption}
              onChange={handleSortChange}
              className="w-full md:w-auto px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            >
              <option value="popularity.desc">Popularity: High to Low</option>
              <option value="popularity.asc">Popularity: Low to High</option>
              <option value="vote_average.desc">Rating: High to Low</option>
              <option value="vote_average.asc">Rating: Low to High</option>
              <option value="release_date.desc">Newest First</option>
              <option value="release_date.asc">Oldest First</option>
              <option value="alphabet.asc">A to Z</option>
              <option value="alphabet.desc">Z to A</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-3 text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="text-lg">Searching for movies...</span>
            </div>
          </div>
        )}

        {/* Movies Grid */}
        {movies.length > 0 && !loading && (
          <>
            <div className="mb-4 text-gray-400 text-center">
              Found {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <div key={movie.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:bg-gray-750">
                  <div className="relative">
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full h-80 object-cover"
                      />
                    ) : (
                      <div className="w-full h-80 bg-gray-700 flex items-center justify-center">
                        <span className="text-6xl">🎬</span>
                      </div>
                    )}
                    {movie.vote_average > 0 && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-sm font-bold">
                        ⭐ {movie.vote_average.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 leading-tight">
                      {movie.title}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-300 mb-4">
                      <p className="flex items-center gap-2">
                        📅 <span>{movie.release_date || 'Release date unknown'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        🌟 <span>{movie.vote_average ? `${movie.vote_average.toFixed(1)}/10` : 'Not rated'}</span>
                      </p>
                      {movie.overview && (
                        <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 mt-2">
                          {movie.overview}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToList(movie)}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      ➕ Add to List
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* No Results */}
        {!loading && movies.length === 0 && query && (
          <div className="text-center py-20">
            <h3 className="text-2xl font-bold text-white mb-4">No movies found</h3>
            <p className="text-gray-400 text-lg mb-2">No results for "{query}"</p>
            <p className="text-gray-500">Try a different search term or check your spelling</p>
          </div>
        )}

        {/* Welcome Message */}
        {!loading && movies.length === 0 && !query && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎭</div>
            <h3 className="text-2xl font-bold text-white mb-4">Start Your Movie Journey</h3>
            <p className="text-gray-400 text-lg">Search for any movie above to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Movies;
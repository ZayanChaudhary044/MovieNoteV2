import React, { useState } from 'react';

const Movies = ({ addToList = () => {}, myList = [], user, isDarkMode = true }) => {
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
        `https://api.themoviedb.org/3/search/movie?api_key=edb25027eda51739f1898a8064bd3f67&query=${encodeURIComponent(query)}`
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
        return sortedMovies.sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));
      case 'release_date.asc':
        return sortedMovies.sort((a, b) => new Date(a.release_date || 0) - new Date(b.release_date || 0));
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
    if (!user) {
      setNotification('Please sign in to add movies to your watchlist');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    addToList(movie);
    setNotification(`${movie.title} added to your watchlist!`);
    setTimeout(() => setNotification(''), 3000);
  };

  const isInWatchlist = (movieId) => {
    return myList.some(movie => movie.id === movieId);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'} py-8 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse text-white ${
            notification.includes('sign in') ? 'bg-red-500' : 'bg-green-500'
          }`}>
            {notification.includes('sign in') ? '🔒' : '✅'} {notification}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-900'} mb-4`}>
            🎬 Movie Search
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-blue-600'} mb-2`}>
            Discover your next favorite movie
          </p>
          {user ? (
            <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              ✅ Signed in as {user.email} • {myList.length} movies in watchlist
            </p>
          ) : (
            <p className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
              🔓 Sign in to save movies to your watchlist
            </p>
          )}
        </div>

        {/* Search Controls */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-blue-100'} p-6 rounded-lg shadow-xl mb-8 transition-colors duration-300`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={query}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="Search for movies..."
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white border-gray-600 focus:border-purple-500 placeholder-gray-400'
                    : 'bg-blue-50 text-blue-900 border-blue-300 focus:border-purple-500 placeholder-blue-500'
                }`}
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
          {movies.length > 0 && (
            <div className="mt-4">
              <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-blue-700'} text-sm font-medium mb-2`}>
                Sort by:
              </label>
              <select
                value={sortOption}
                onChange={handleSortChange}
                className={`w-full md:w-auto px-4 py-2 rounded-lg border focus:outline-none transition-colors duration-300 ${
                  isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600 focus:border-purple-500'
                    : 'bg-blue-50 text-blue-900 border-blue-300 focus:border-purple-500'
                }`}
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
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className={`flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="text-lg">Searching for movies...</span>
            </div>
          </div>
        )}

        {/* Movies Grid */}
        {movies.length > 0 && !loading && (
          <>
            <div className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-blue-600'} text-center`}>
              Found {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
              {query && ` for "${query}"`}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {movies.map((movie) => {
                const inWatchlist = isInWatchlist(movie.id);
                
                return (
                  <div 
                    key={movie.id} 
                    className={`${isDarkMode ? 'bg-gray-800' : 'bg-blue-100'} rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
                  >
                    <div className="relative">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                          alt={movie.title}
                          className="w-full h-80 object-cover"
                        />
                      ) : (
                        <div className={`w-full h-80 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-200'} flex items-center justify-center`}>
                          <span className="text-6xl">🎬</span>
                        </div>
                      )}
                      
                      {/* Rating Badge */}
                      {movie.vote_average > 0 && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-sm font-bold">
                          ⭐ {movie.vote_average.toFixed(1)}
                        </div>
                      )}
                      
                      {/* In Watchlist Badge */}
                      {inWatchlist && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          ✅ In List
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className={`${isDarkMode ? 'text-white' : 'text-blue-900'} font-bold text-lg mb-2 line-clamp-2 leading-tight`}>
                        {movie.title}
                      </h3>
                      <div className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-700'} mb-4`}>
                        <p className="flex items-center gap-2">
                          📅 <span>{movie.release_date || 'Release date unknown'}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          🌟 <span>{movie.vote_average ? `${movie.vote_average.toFixed(1)}/10` : 'Not rated'}</span>
                        </p>
                        {movie.overview && (
                          <p className={`${isDarkMode ? 'text-gray-400' : 'text-blue-600'} text-xs leading-relaxed line-clamp-3 mt-2`}>
                            {movie.overview}
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleAddToList(movie)}
                        disabled={inWatchlist}
                        className={`w-full py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                          inWatchlist
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
                        }`}
                      >
                        {inWatchlist ? '✅ Already Added' : '➕ Add to Watchlist'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* No Results */}
        {!loading && movies.length === 0 && query && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-900'} mb-4`}>
              No movies found
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-blue-600'} text-lg mb-2`}>
              No results for "{query}"
            </p>
            <p className={`${isDarkMode ? 'text-gray-500' : 'text-blue-500'} mb-4`}>
              Try a different search term or check your spelling
            </p>
            <button
              onClick={() => setQuery('')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Welcome Message */}
        {!loading && movies.length === 0 && !query && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎭</div>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-900'} mb-4`}>
              Start Your Movie Journey
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-blue-600'} text-lg mb-4`}>
              Search for any movie above to discover new titles!
            </p>
            {user ? (
              <div className={`${isDarkMode ? 'text-gray-500' : 'text-blue-500'} text-sm`}>
                🎬 Movies you add will be saved to your watchlist and synced across devices
              </div>
            ) : (
              <div className={`${isDarkMode ? 'text-gray-500' : 'text-blue-500'} text-sm`}>
                🔐 Sign in to save movies to your personal watchlist
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Movies;
import React, { useState } from 'react';

const List = ({ myList = [], removeFromList = () => {}, user, loading = false, isDarkMode = true }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('added');
  const [notification, setNotification] = useState('');
  const [removingMovies, setRemovingMovies] = useState(new Set()); // Track which movies are being removed

  const handleRemove = async (movie) => {
    if (!user) {
      setNotification('Please sign in to remove movies');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    // Mark movie as being removed
    setRemovingMovies(prev => new Set(prev).add(movie.id));

    try {
      const result = await removeFromList(movie);
      
      if (result?.success !== false) {
        setNotification(`${movie.title} removed from your list`);
      } else {
        setNotification(result?.error || 'Failed to remove movie');
      }
    } catch (error) {
      console.error('Error removing movie:', error);
      setNotification('Failed to remove movie. Please try again.');
    } finally {
      // Remove from removing set
      setRemovingMovies(prev => {
        const newSet = new Set(prev);
        newSet.delete(movie.id);
        return newSet;
      });
      setTimeout(() => setNotification(''), 3000);
    }
  };

  // Check if movie is currently being removed
  const isBeingRemoved = (movieId) => {
    return removingMovies.has(movieId);
  };

  const filteredAndSortedList = () => {
    let filtered = [...myList];
    
    // Apply filters
    switch (filter) {
      case 'high-rated':
        filtered = filtered.filter(movie => movie.vote_average >= 7);
        break;
      case 'recent':
        filtered = filtered.filter(movie => {
          const releaseYear = new Date(movie.release_date).getFullYear();
          return releaseYear >= 2020;
        });
        break;
      case 'classics':
        filtered = filtered.filter(movie => {
          const releaseYear = new Date(movie.release_date).getFullYear();
          return releaseYear < 2000;
        });
        break;
      case 'watched':
        filtered = filtered.filter(movie => movie.watched === true);
        break;
      case 'unwatched':
        filtered = filtered.filter(movie => movie.watched !== true);
        break;
      default:
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        break;
      case 'release_date':
        filtered.sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));
        break;
      case 'added':
        // Sort by date added (newest first) using database added_at field
        if (filtered[0]?.added_at) {
          filtered.sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
        }
        break;
      default:
        break;
    }

    return filtered;
  };

  const list = filteredAndSortedList();

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  // Get filter counts - with safety checks
  const getFilterCounts = () => ({
    all: myList.length,
    'high-rated': myList.filter(m => (m.vote_average || 0) >= 7).length,
    recent: myList.filter(m => {
      try {
        const year = new Date(m.release_date).getFullYear();
        return year >= 2020;
      } catch {
        return false;
      }
    }).length,
    classics: myList.filter(m => {
      try {
        const year = new Date(m.release_date).getFullYear();
        return year < 2000;
      } catch {
        return false;
      }
    }).length,
    watched: myList.filter(m => m.watched === true).length,
    unwatched: myList.filter(m => m.watched !== true).length
  });

  const filterCounts = getFilterCounts();

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} py-8 transition-colors duration-300`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="py-20">
            <div className="text-6xl mb-6">🔐</div>
            <h3 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Sign in to view your watchlist
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-8 text-lg`}>
              Your personal movie collection is stored securely in your account
            </p>
            <div className="space-y-4">
              <div className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'} text-sm mt-4`}>
                Sign in to save, sync, and manage your watchlist across all devices
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} py-8 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse text-white ${
            notification.includes('sign in') || notification.includes('Failed') || notification.includes('Error')
              ? 'bg-red-500' 
              : 'bg-green-500'
          }`}>
            {notification.includes('removed') ? '🗑️' : 
             notification.includes('Failed') || notification.includes('Error') ? '❌' : '🔒'} {notification}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            📝 My Watchlist
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            {myList.length} {myList.length === 1 ? 'movie' : 'movies'} in your collection
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            ✅ Synced to your account • {user.email}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading your watchlist...</p>
          </div>
        )}

        {!loading && myList.length > 0 && (
          <>
            {/* Controls */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-xl mb-8 transition-colors duration-300`}>
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                {/* Filter Options */}
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium mb-2`}>
                    Filter:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'all', label: 'All Movies', count: filterCounts.all },
                      { key: 'high-rated', label: 'High Rated (7+)', count: filterCounts['high-rated'] },
                      { key: 'recent', label: 'Recent (2020+)', count: filterCounts.recent },
                      { key: 'classics', label: 'Classics (Pre-2000)', count: filterCounts.classics },
                      { key: 'watched', label: 'Watched', count: filterCounts.watched },
                      { key: 'unwatched', label: 'To Watch', count: filterCounts.unwatched }
                    ].map(({ key, label, count }) => (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-3 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                          filter === key
                            ? 'bg-purple-600 text-white'
                            : isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {label} ({count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium mb-2`}>
                    Sort by:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`px-4 py-2 rounded-lg border focus:outline-none transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600 focus:border-purple-500'
                        : 'bg-white text-gray-900 border-gray-300 focus:border-purple-500'
                    }`}
                  >
                    <option value="added">Date Added</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="rating">Rating (High-Low)</option>
                    <option value="release_date">Release Date (New-Old)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Movies Grid */}
            {list.length > 0 ? (
              <>
                <div className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center`}>
                  Showing {list.length} of {myList.length} movies
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {list.map((movie) => {
                    const beingRemoved = isBeingRemoved(movie.id);
                    
                    return (
                      <div 
                        key={movie.id} 
                        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group ${
                          beingRemoved ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="relative">
                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                              alt={movie.title}
                              className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className={`w-full h-80 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                              <span className="text-6xl">🎬</span>
                            </div>
                          )}
                          
                          {/* Rating Badge */}
                          {movie.vote_average > 0 && (
                            <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-full text-sm font-bold">
                              ⭐ {movie.vote_average.toFixed(1)}
                            </div>
                          )}
                          
                          {/* Watched Status */}
                          <div className="absolute top-2 left-2">
                            {movie.watched ? (
                              <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                ✅ Watched
                              </div>
                            ) : (
                              <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                📋 To Watch
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <h3 className={`${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold text-lg mb-2 line-clamp-2 leading-tight`}>
                            {movie.title}
                          </h3>
                          
                          <div className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                            <p className="flex items-center gap-2">
                              📅 <span>{formatDate(movie.release_date)}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              🌟 <span>{movie.vote_average ? `${movie.vote_average.toFixed(1)}/10` : 'Not rated'}</span>
                            </p>
                            {movie.added_at && (
                              <p className="flex items-center gap-2">
                                ➕ <span>Added {formatDate(movie.added_at)}</span>
                              </p>
                            )}
                            {movie.personal_rating && (
                              <p className="flex items-center gap-2">
                                ⭐ <span>Your rating: {movie.personal_rating}/10</span>
                              </p>
                            )}
                          </div>

                          {movie.personal_notes && (
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-4 p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded`}>
                              💭 "{movie.personal_notes}"
                            </div>
                          )}
                          
                          <button
                            onClick={() => handleRemove(movie)}
                            disabled={beingRemoved}
                            className={`w-full py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                              beingRemoved
                                ? 'bg-gray-500 text-gray-300 cursor-wait'
                                : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                            }`}
                          >
                            {beingRemoved ? (
                              <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Removing...
                              </span>
                            ) : (
                              '🗑️ Remove'
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                  No movies match your filter
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-8`}>
                  Try a different filter or add more movies to your list
                </p>
                <button
                  onClick={() => setFilter('all')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                >
                  Show All Movies
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && myList.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🎬</div>
            <h3 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Your watchlist is empty
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-8 text-lg`}>
              Start building your movie collection by searching and adding movies!
            </p>
            <div className="space-y-4">
              <div className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'} text-sm mt-4`}>
                Tip: Use the search page to discover new movies and add them to your list
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default List;
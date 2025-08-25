
import React, { useState, useEffect } from 'react';

const List = ({ myList = [], removeFromList = () => {} }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('added');
  const [notification, setNotification] = useState('');

  const handleRemove = (movie) => {
    removeFromList(movie);
    setNotification(`${movie.title} removed from your list`);
    setTimeout(() => setNotification(''), 3000);
  };

  const filteredAndSortedList = () => {
    let filtered = [...myList];
    
    // Apply filters
    switch (filter) {
      case 'high-rated':
        filtered = filtered.filter(movie => movie.vote_average >= 7);
        break;
      case 'recent':
        filtered = filtered.filter(movie => new Date(movie.release_date) > new Date('2020-01-01'));
        break;
      case 'classics':
        filtered = filtered.filter(movie => new Date(movie.release_date) < new Date('2000-01-01'));
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
        filtered.sort((a, b) => b.vote_average - a.vote_average);
        break;
      case 'release_date':
        filtered.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
        break;
      default:
        // Keep original order (added order)
        break;
    }

    return filtered;
  };

  const list = filteredAndSortedList();

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Notification */}
        {notification && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
            🗑️ {notification}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">📝 My Watchlist</h1>
          <p className="text-gray-400">
            {myList.length} {myList.length === 1 ? 'movie' : 'movies'} in your collection
          </p>
        </div>

        {myList.length > 0 && (
          <>
            {/* Controls */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                {/* Filter Options */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Filter:</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'all', label: 'All Movies', count: myList.length },
                      { key: 'high-rated', label: 'High Rated (7+)', count: myList.filter(m => m.vote_average >= 7).length },
                      { key: 'recent', label: 'Recent (2020+)', count: myList.filter(m => new Date(m.release_date) > new Date('2020-01-01')).length },
                      { key: 'classics', label: 'Classics (Pre-2000)', count: myList.filter(m => new Date(m.release_date) < new Date('2000-01-01')).length }
                    ].map(({ key, label, count }) => (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-3 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
                          filter === key
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {label} ({count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
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
                <div className="mb-4 text-gray-400 text-center">
                  Showing {list.length} of {myList.length} movies
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {list.map((movie) => (
                    <div key={movie.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group">
                      <div className="relative">
                        {movie.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
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
                            📅 <span>{movie.release_date || 'Unknown'}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            🌟 <span>{movie.vote_average ? `${movie.vote_average.toFixed(1)}/10` : 'Not rated'}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemove(movie)}
                          className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-4">No movies match your filter</h3>
                <p className="text-gray-400 mb-8">Try a different filter or add more movies to your list</p>
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
        {myList.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🎬</div>
            <h3 className="text-3xl font-bold text-white mb-4">Your watchlist is empty</h3>
            <p className="text-gray-400 mb-8 text-lg">Start building your movie collection by searching and adding movies!</p>
            <div className="space-y-4">
              <div className="text-gray-500 text-sm mt-4">
                💡 Tip: Use the search page to discover new movies and add them to your list
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



export default List;
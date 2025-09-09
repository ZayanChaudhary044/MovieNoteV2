import React from "react";
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Auth from "./pages/auth";
import UserDropdown from "./pages/dropdown";
import Home from "./pages/home";
import Movies from "./pages/movies";
import List from "./pages/yrlist";

// Enhanced Navigation Component with Tailwind
const Navigation = ({ user, onSignOut, onShowAuth, isDarkMode, onThemeToggle }) => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} shadow-lg sticky top-0 z-50 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link
            to="/"
            className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} bg-clip-text text-transparent hover:from-purple-300 hover:via-pink-300 hover:to-indigo-300 transition-all duration-300`}
          >
            MovieNote
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <ul className="flex space-x-1">
              {[
                { path: '/', label: 'Home', icon: '🏠' },
                { path: '/movies', label: 'Movies', icon: '🎬' },
                { path: '/yrlist', label: 'Your List', icon: '📝' }
              ].map(({ path, label, icon }) => (
                <li key={path}>
                  <Link
                    to={path}
                    className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${isActive(path)
                        ? 'bg-gradient-to-br from-blue-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                        : isDarkMode
                          ? 'text-gray-300 hover:text-white hover:bg-gray-800 hover:shadow-md'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-md'
                      }`}
                  >
                    <span className="text-sm md:text-base">{icon}</span>
                    <span className="hidden sm:inline text-sm md:text-base">{label}</span>
                    {/* Mobile: show only on Your List for space */}
                    {path === '/yrlist' && (
                      <span className="sm:hidden text-sm">{label}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {/* User Authentication */}
            {user ? (
              <UserDropdown
                user={user}
                onSignOut={onSignOut}
                onThemeToggle={onThemeToggle}
                isDarkMode={isDarkMode}
              />
            ) : (
              <button
                onClick={onShowAuth}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-300"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subtle gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
    </nav>
  );
};

const App = () => {
  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('movieNoteTheme');
    return saved ? JSON.parse(saved) : true;
  });

  // Watchlist state
  const [myList, setMyList] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Load user's watchlist from database - IMPROVED VERSION
  const loadWatchlist = async (userId) => {
    if (!userId || watchlistLoading) {
      console.log('Skipping watchlist load - no userId or already loading');
      return;
    }

    console.log('🔄 Loading watchlist for user:', userId);
    setWatchlistLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_watchlists')
        .select(`
          id,
          user_id,
          movie_id,
          added_at,
          watched,
          personal_rating,
          personal_notes,
          movies (
            id,
            title,
            overview,
            release_date,
            poster_path,
            backdrop_path,
            vote_average,
            vote_count,
            runtime,
            genres
          )
        `)
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading watchlist:', error);
        setMyList([]);
        return;
      }

      // Ensure we have data and movies exist
      const validData = data?.filter(item => item.movies) || [];

      const transformedList = validData.map(item => ({
        // Movie data from the movies table
        id: item.movies.id,
        title: item.movies.title,
        overview: item.movies.overview,
        release_date: item.movies.release_date,
        poster_path: item.movies.poster_path,
        backdrop_path: item.movies.backdrop_path,
        vote_average: item.movies.vote_average,
        vote_count: item.movies.vote_count,
        runtime: item.movies.runtime,
        genres: item.movies.genres,
        // Watchlist-specific data
        watchlist_id: item.id,
        added_at: item.added_at,
        watched: item.watched,
        personal_rating: item.personal_rating,
        personal_notes: item.personal_notes
      }));

      setMyList(transformedList);
      console.log('✅ Watchlist loaded:', transformedList.length, 'movies');

    } catch (error) {
      console.error('💥 Failed to load watchlist:', error);
      setMyList([]);
    } finally {
      setWatchlistLoading(false);
    }
  };

  // Initialize authentication - SIMPLIFIED AND FIXED
  useEffect(() => {
    console.log('🔧 Setting up authentication...');

    let isMounted = true;

    const initAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth error:', error);
          setAuthError(error.message);
        }

        if (isMounted) {
          if (session?.user) {
            console.log('✅ Found existing session:', session.user.email);
            setUser(session.user);
            // Load watchlist after setting user
            setTimeout(() => loadWatchlist(session.user.id), 100);
          } else {
            console.log('ℹ️ No existing session');
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 Auth initialization error:', error);
        if (isMounted) {
          setAuthError(error.message);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event);

        if (!isMounted) return;

        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in:', session.user.email);
            setUser(session.user);
            setAuthError(null);
            await loadWatchlist(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out');
            setUser(null);
            setMyList([]);
            setAuthError(null);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 Token refreshed');
          }
        } catch (error) {
          console.error('💥 Auth state change error:', error);
          setAuthError(error.message);
        }
      }
    );

    // Initialize auth
    initAuth();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Add movie to watchlist - IMPROVED ERROR HANDLING
  const addToList = async (movie) => {
    if (!user) {
      console.log('❌ No user logged in');
      return { success: false, error: 'Not logged in' };
    }

    // Check if already in list
    if (myList.find(m => m.id === movie.id)) {
      console.log('⚠️ Movie already in watchlist');
      return { success: false, error: 'Already in watchlist' };
    }

    console.log('🎬 Adding movie to list:', movie.title);

    try {
      // Step 1: Insert movie into movies table (upsert to handle duplicates)
      const { error: movieError } = await supabase
        .from('movies')
        .upsert({
          id: movie.id,
          title: movie.title,
          overview: movie.overview || '',
          release_date: movie.release_date || null,
          poster_path: movie.poster_path || null,
          backdrop_path: movie.backdrop_path || null,
          vote_average: movie.vote_average || 0,
          vote_count: movie.vote_count || 0,
          runtime: movie.runtime || null,
          genres: movie.genres || null,
          original_language: movie.original_language || null,
          original_title: movie.original_title || movie.title,
          adult: movie.adult || false,
          popularity: movie.popularity || 0
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (movieError) {
        console.error('❌ Error saving movie:', movieError);
        return { success: false, error: 'Failed to save movie' };
      }

      // Step 2: Add to user's watchlist
      const { data: watchlistData, error: watchlistError } = await supabase
        .from('user_watchlists')
        .insert({
          user_id: user.id,
          movie_id: movie.id,
          watched: false,
          personal_rating: null,
          personal_notes: null
        })
        .select('id, added_at, watched, personal_rating, personal_notes')
        .single();

      if (watchlistError) {
        console.error('❌ Error adding to watchlist:', watchlistError);
        return { success: false, error: 'Failed to add to watchlist' };
      }

      // Step 3: Update local state
      const movieWithDbInfo = {
        ...movie,
        watchlist_id: watchlistData.id,
        added_at: watchlistData.added_at,
        watched: watchlistData.watched,
        personal_rating: watchlistData.personal_rating,
        personal_notes: watchlistData.personal_notes
      };

      setMyList(prev => [movieWithDbInfo, ...prev]);
      console.log('🎉 Movie successfully added to watchlist!');

      return { success: true };

    } catch (error) {
      console.error('💥 Failed to add movie:', error);
      return { success: false, error: error.message };
    }
  };

  // Remove movie from watchlist - IMPROVED
  const removeFromList = async (movie) => {
    if (!user) {
      console.log('❌ No user logged in');
      return { success: false, error: 'Not logged in' };
    }

    console.log('🗑️ Removing movie from list:', movie.title);

    try {
      const { error } = await supabase
        .from('user_watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movie.id);

      if (error) {
        console.error('❌ Error removing from watchlist:', error);
        return { success: false, error: 'Failed to remove from watchlist' };
      }

      // Update local state
      setMyList(prev => prev.filter(m => m.id !== movie.id));
      console.log('✅ Movie removed successfully');

      return { success: true };

    } catch (error) {
      console.error('💥 Failed to remove movie:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign out handler - IMPROVED
  const handleSignOut = async () => {
    console.log('🚪 Signing out...');

    try {
      // Clear state first for immediate UI feedback
      setUser(null);
      setMyList([]);
      setAuthError(null);

      // Then call Supabase signOut
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
        // Don't show this error to user since state is already cleared
      }

      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('💥 Sign out error:', error);
    }
  };

  const handleShowAuth = () => setShowAuth(true);
  const handleCloseAuth = () => setShowAuth(false);

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('movieNoteTheme', JSON.stringify(newTheme));
  };

  // Show loading screen
  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center transition-colors duration-300`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} text-xl`}>Loading MovieNote...</div>
          {authError && (
            <div className="mt-4 text-red-500 text-sm">
              Connection issue: {authError}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-300`}>
      {/* Development status */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 text-center text-sm bg-green-900 text-green-200">
          Connected {user ? `- ${user.email} (${myList.length} movies)` : '- Not logged in'}
          {authError && <span className="ml-4 text-red-300">Auth Error: {authError}</span>}
        </div>
      )}

      <Router>
        <Navigation
          user={user}
          onSignOut={handleSignOut}
          onShowAuth={handleShowAuth}
          isDarkMode={isDarkMode}
          onThemeToggle={handleThemeToggle}
        />
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Home user={user} isDarkMode={isDarkMode} />} />
            <Route
              path="/movies"
              element={
                <Movies
                  addToList={addToList}
                  myList={myList}
                  user={user}
                  isDarkMode={isDarkMode}
                />
              }
            />
            <Route
              path="/yrlist"
              element={
                <List
                  myList={myList}
                  removeFromList={removeFromList}
                  user={user}
                  loading={watchlistLoading}
                  isDarkMode={isDarkMode}
                />
              }
            />
          </Routes>
        </main>

        {/* Auth Modal */}
        {showAuth && <Auth onClose={handleCloseAuth} />}
      </Router>
    </div>
  );
};

export default App;
import React from "react";
import { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Auth from "./pages/auth";
import UserDropdown from "./pages/dropdown-comp";
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
                    className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                      isActive(path)
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
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const saved = localStorage.getItem('movieNoteTheme');
    return saved ? JSON.parse(saved) : true; // Default to dark mode
  });
  
  // Watchlist state - now from Supabase
  const [myList, setMyList] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  
  // Connection state
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Load user's watchlist from Supabase
  const loadWatchlist = useCallback(async (userId = null) => {
    if (!userId && !user) return;
    
    setWatchlistLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_watchlist_with_movies')
        .select('*')
        .eq('user_id', userId || user.id)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error loading watchlist:', error);
        // Fallback to localStorage if database fails
        const saved = localStorage.getItem('movieWatchlist');
        setMyList(saved ? JSON.parse(saved) : []);
      } else {
        // Transform data to match current format
        const transformedList = data.map(item => ({
          id: item.movie_id,
          title: item.title,
          overview: item.overview,
          release_date: item.release_date,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          vote_average: item.vote_average,
          vote_count: item.vote_count,
          runtime: item.runtime,
          genres: item.genres,
          // Additional fields from database
          watchlist_id: item.id,
          added_at: item.added_at,
          watched: item.watched,
          personal_rating: item.personal_rating,
          personal_notes: item.personal_notes
        }));
        setMyList(transformedList);
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    } finally {
      setWatchlistLoading(false);
    }
  }, [user]);

  // Initialize authentication and load user data
  useEffect(() => {
    const initializeAuth = async () => {
  console.log('🔍 Starting auth initialization...');
  console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
  console.log('Supabase Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
  
  try {
    console.log('📡 Getting session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('Session data:', session);
    console.log('Session error:', error);
    
    if (error) {
      console.error('❌ Auth error:', error);
      setConnectionError(error.message);
    } else {
      console.log('✅ Auth successful');
      setUser(session?.user || null);
      setSupabaseConnected(true);
    }
  } catch (error) {
    console.error('💥 Failed to initialize auth:', error);
    setConnectionError('Failed to connect to Supabase');
  } finally {
    console.log('🏁 Setting loading to false');
    setLoading(false);
  }
};

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user || null);
        
        if (session?.user) {
          // Load watchlist when user logs in
          await loadWatchlist(session.user.id);
        } else {
          // Clear watchlist when user logs out
          setMyList([]);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, [loadWatchlist]);

  // Load watchlist when user is available
  useEffect(() => {
    if (user) {
      loadWatchlist();
    }
  }, [user, loadWatchlist]);

  const addToList = async (movie) => {
    // If not authenticated, use localStorage as fallback
    if (!user) {
      // Check for duplicates
      if (!myList.find(m => m.id === movie.id)) {
        const newList = [...myList, movie];
        setMyList(newList);
        try {
          localStorage.setItem('movieWatchlist', JSON.stringify(newList));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }
      return;
    }

    // Check if already in list
    if (myList.find(m => m.id === movie.id)) {
      console.log('Movie already in watchlist');
      return;
    }

    try {
      // First, insert or update the movie in the movies table
      const { error: movieError } = await supabase
        .from('movies')
        .upsert({
          id: movie.id,
          title: movie.title,
          overview: movie.overview,
          release_date: movie.release_date,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          vote_average: movie.vote_average,
          vote_count: movie.vote_count,
          runtime: movie.runtime,
          genres: movie.genres,
          original_language: movie.original_language,
          original_title: movie.original_title,
          adult: movie.adult,
          popularity: movie.popularity
        }, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (movieError) {
        console.error('Error saving movie:', movieError);
        return;
      }

      // Then add to user's watchlist
      const { data, error } = await supabase
        .from('user_watchlists')
        .insert({
          user_id: user.id,
          movie_id: movie.id
        })
        .select('id, added_at')
        .single();

      if (error) {
        console.error('Error adding to watchlist:', error);
        // Fallback to localStorage
        const newList = [...myList, movie];
        setMyList(newList);
        localStorage.setItem('movieWatchlist', JSON.stringify(newList));
      } else {
        // Add to local state with database info
        const movieWithDbInfo = {
          ...movie,
          watchlist_id: data.id,
          added_at: data.added_at,
          watched: false,
          personal_rating: null,
          personal_notes: null
        };
        setMyList(prev => [movieWithDbInfo, ...prev]);
        console.log('Movie added to watchlist successfully');
      }
    } catch (error) {
      console.error('Failed to add movie to watchlist:', error);
      // Fallback to localStorage
      const newList = [...myList, movie];
      setMyList(newList);
      localStorage.setItem('movieWatchlist', JSON.stringify(newList));
    }
  };

  const removeFromList = async (movie) => {
    // If not authenticated, use localStorage as fallback
    if (!user) {
      const newList = myList.filter((m) => m.id !== movie.id);
      setMyList(newList);
      try {
        localStorage.setItem('movieWatchlist', JSON.stringify(newList));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('user_watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movie.id);

      if (error) {
        console.error('Error removing from watchlist:', error);
        // Fallback to localStorage
        const newList = myList.filter((m) => m.id !== movie.id);
        setMyList(newList);
        localStorage.setItem('movieWatchlist', JSON.stringify(newList));
      } else {
        // Remove from local state
        setMyList(prev => prev.filter((m) => m.id !== movie.id));
        console.log('Movie removed from watchlist successfully');
      }
    } catch (error) {
      console.error('Failed to remove movie from watchlist:', error);
      // Fallback to localStorage
      const newList = myList.filter((m) => m.id !== movie.id);
      setMyList(newList);
      localStorage.setItem('movieWatchlist', JSON.stringify(newList));
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleShowAuth = () => {
    setShowAuth(true);
  };

  const handleCloseAuth = () => {
    setShowAuth(false);
  };

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('movieNoteTheme', JSON.stringify(newTheme));
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center transition-colors duration-300`}>
        <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} text-xl`}>Loading MovieNote...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-300`}>
      {/* Supabase Connection Status (Development only - remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`p-2 text-center text-sm ${
          supabaseConnected 
            ? 'bg-green-900 text-green-200' 
            : connectionError 
            ? 'bg-red-900 text-red-200'
            : 'bg-yellow-900 text-yellow-200'
        }`}>
          {supabaseConnected 
            ? `✅ Supabase Connected${user ? ` - Logged in as ${user.email}` : ' - Not logged in'}` 
            : connectionError 
            ? `❌ Supabase Error: ${connectionError}`
            : '🔄 Testing Supabase Connection...'
          }
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
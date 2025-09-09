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
    const saved = localStorage.getItem('movieNoteTheme');
    return saved ? JSON.parse(saved) : true;
  });
  
  // Watchlist state
  const [myList, setMyList] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Load user's watchlist from database - FIXED VERSION
  const loadWatchlist = async (userId) => {
    if (!userId) {
      console.log('No userId provided to loadWatchlist');
      return;
    }
    
    console.log('🔄 Loading watchlist for user:', userId);
    setWatchlistLoading(true);
    
    try {
      // Use JOIN query instead of view to avoid view issues
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
      } else {
        console.log('✅ Raw watchlist data:', data);
        
        // Transform the joined data
        const transformedList = data.map(item => ({
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
        console.log('✅ Transformed watchlist:', transformedList);
        console.log('📊 Final list length:', transformedList.length);
      }
    } catch (error) {
      console.error('💥 Failed to load watchlist:', error);
      setMyList([]);
    } finally {
      setWatchlistLoading(false);
    }
  };

  // Initialize authentication - SIMPLIFIED FIX
  useEffect(() => {
    console.log('Setting up auth...');
    
    let isMounted = true;
    
    // Set loading to false immediately to prevent infinite loading
    setLoading(false);
    
    const initAuth = async () => {
      try {
        // Try to get session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 3000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (isMounted && session?.user) {
          console.log('Found session for:', session.user.email);
          setUser(session.user);
          await loadWatchlist(session.user.id);
        }
      } catch (error) {
        console.log('No existing session or timeout:', error.message);
        // This is fine - user just isn't logged in
      }
    };

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await loadWatchlist(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setMyList([]);
        }
      }
    );

    // Run init after a small delay to ensure the app loads first
    setTimeout(initAuth, 100);

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Add movie to watchlist - BULLETPROOF VERSION
  const addToList = async (movie) => {
    console.log('🎬 Adding movie to list:', movie.title);
    console.log('👤 Current user:', user?.email);
    console.log('📋 Current list length:', myList.length);
    
    if (!user) {
      console.log('❌ No user logged in');
      return;
    }

    // Check if already in list
    if (myList.find(m => m.id === movie.id)) {
      console.log('⚠️ Movie already in watchlist');
      return;
    }

    try {
      // Step 1: Insert movie into movies table
      console.log('💾 Step 1: Inserting movie into movies table...');
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
          onConflict: 'id' 
        });

      if (movieError) {
        console.error('❌ Error saving movie:', movieError);
        return;
      }
      console.log('✅ Movie saved to movies table');

      // Step 2: Add to user's watchlist
      console.log('📝 Step 2: Adding to user watchlist...');
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
        return;
      }

      console.log('✅ Added to watchlist, got data:', watchlistData);

      // Step 3: Update local state immediately
      const movieWithDbInfo = {
        ...movie,
        watchlist_id: watchlistData.id,
        added_at: watchlistData.added_at,
        watched: watchlistData.watched,
        personal_rating: watchlistData.personal_rating,
        personal_notes: watchlistData.personal_notes
      };

      setMyList(prev => {
        const newList = [movieWithDbInfo, ...prev];
        console.log('📊 Updated local state - old length:', prev.length, 'new length:', newList.length);
        return newList;
      });

      console.log('🎉 Movie successfully added to watchlist!');

    } catch (error) {
      console.error('💥 Failed to add movie:', error);
    }
  };

  // Remove movie from watchlist
  const removeFromList = async (movie) => {
    console.log('🗑️ Removing movie from list:', movie.title);
    
    if (!user) {
      console.log('❌ No user logged in');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movie.id);

      if (error) {
        console.error('❌ Error removing from watchlist:', error);
        return;
      }

      // Update local state
      setMyList(prev => {
        const newList = prev.filter(m => m.id !== movie.id);
        console.log('📊 Removed from local state - old length:', prev.length, 'new length:', newList.length);
        return newList;
      });
      
      console.log('✅ Movie removed successfully');

    } catch (error) {
      console.error('💥 Failed to remove movie:', error);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    console.log('🚪 Signing out...');
    
    try {
      // Clear state immediately for instant UI feedback
      setUser(null);
      setMyList([]);
      
      // Then call Supabase signOut
      await supabase.auth.signOut();
      
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

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center transition-colors duration-300`}>
        <div className={`${isDarkMode ? 'text-white' : 'text-gray-900'} text-xl`}>Loading MovieNote...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-300`}>
      {/* Development status */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-2 text-center text-sm bg-green-900 text-green-200">
          Connected {user ? `- ${user.email} (${myList.length} movies)` : '- Not logged in'}
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
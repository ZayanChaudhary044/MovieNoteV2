import React from "react";
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Auth from "./pages/auth";
import UserDropdown from "./pages/dropdown";
import Home from "./pages/home";
import Movies from "./pages/movies";
import List from "./pages/yrlist";
import Profile from "./pages/profile";

// Enhanced Navigation Component with Light Blue Theme
const Navigation = ({ user, onSignOut, onShowAuth, isDarkMode, onThemeToggle }) => {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className={`${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'} shadow-lg sticky top-0 z-50 border-b ${isDarkMode ? 'border-gray-800' : 'border-blue-200'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link 
            to="/" 
            className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-900'} bg-clip-text text-transparent hover:from-purple-300 hover:via-pink-300 hover:to-indigo-300 transition-all duration-300`}
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
                        : 'text-blue-700 hover:text-blue-900 hover:bg-blue-100 hover:shadow-md'
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

  // Load user's watchlist from database - SIMPLE VERSION
  const loadWatchlist = async (userId) => {
    if (!userId) {
      setWatchlistLoading(false);
      setMyList([]);
      return;
    }
    
    console.log('Loading watchlist for user:', userId);
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
        console.error('Error loading watchlist:', error);
        setMyList([]);
      } else {
        const validData = data?.filter(item => item.movies) || [];
        const transformedList = validData.map(item => ({
          // Movie data
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
          // Watchlist data
          watchlist_id: item.id,
          added_at: item.added_at,
          watched: item.watched,
          personal_rating: item.personal_rating,
          personal_notes: item.personal_notes
        }));
        
        setMyList(transformedList);
        console.log('Watchlist loaded:', transformedList.length, 'movies');
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error);
      setMyList([]);
    } finally {
      setWatchlistLoading(false);
    }
  };

  // Initialize authentication - SIMPLE VERSION
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          loadWatchlist(session.user.id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Auth error:', error);
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          loadWatchlist(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setMyList([]);
          setWatchlistLoading(false);
        }
      }
    );

    initAuth();

    return () => subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add movie to watchlist - SIMPLE VERSION
  const addToList = async (movie) => {
    if (!user) return;
    if (myList.find(m => m.id === movie.id)) return;

    try {
      // Insert movie
      await supabase.from('movies').upsert({
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
      }, { onConflict: 'id' });

      // Add to watchlist
      const { data } = await supabase.from('user_watchlists').insert({
        user_id: user.id,
        movie_id: movie.id,
        watched: false
      }).select().single();

      if (data) {
        const movieWithDbInfo = {
          ...movie,
          watchlist_id: data.id,
          added_at: data.added_at,
          watched: data.watched
        };
        setMyList(prev => [movieWithDbInfo, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add movie:', error);
    }
  };

  // Remove movie from watchlist - SIMPLE VERSION
  const removeFromList = async (movie) => {
    if (!user) return;

    try {
      await supabase.from('user_watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movie.id);

      setMyList(prev => prev.filter(m => m.id !== movie.id));
    } catch (error) {
      console.error('Failed to remove movie:', error);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    setUser(null);
    setMyList([]);
    setWatchlistLoading(false);
    await supabase.auth.signOut();
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
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'} flex items-center justify-center transition-colors duration-300`}>
        <div className={`${isDarkMode ? 'text-white' : 'text-blue-900'} text-xl`}>Loading MovieNote...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'} transition-colors duration-300`}>


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
            <Route 
  path="/profile" 
  element={
    <Profile 
      user={user}
      isDarkMode={isDarkMode}
      onThemeToggle={handleThemeToggle}
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
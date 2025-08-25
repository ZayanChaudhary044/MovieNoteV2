import React from "react";
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
// Remove this line: import "./App.css";
import Home from "./pages/home";
import Movies from "./pages/movies";
import List from "./pages/yrlist";

// Enhanced Navigation Component with Tailwind
const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className="bg-gray-900 shadow-lg sticky top-0 z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link 
            to="/" 
            className="text-2xl md:text-3xl font-bold text-white bg-clip-text text-transparent hover:from-purple-300 hover:via-pink-300 hover:to-indigo-300 transition-all duration-300"
          >
            MovieNote
          </Link>
          
          {/* Navigation Links */}
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
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800 hover:shadow-md'
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
        </div>
      </div>
      
      {/* Subtle gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
    </nav>
  );
};

const App = () => {
  // Enhanced state management with localStorage persistence
  const [myList, setMyList] = useState(() => {
    try {
      const saved = localStorage.getItem('movieWatchlist');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved watchlist:', error);
      return [];
    }
  });

  const addToList = (movie) => {
    // Prevent duplicates
    if (!myList.find(m => m.id === movie.id)) {
      const newList = [...myList, movie];
      setMyList(newList);
      // Persist to localStorage
      try {
        localStorage.setItem('movieWatchlist', JSON.stringify(newList));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  };

  const removeFromList = (movie) => {
    const newList = myList.filter((m) => m.id !== movie.id);
    setMyList(newList);
    // Persist to localStorage
    try {
      localStorage.setItem('movieWatchlist', JSON.stringify(newList));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Router>
        <Navigation />
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies addToList={addToList} />} />
            <Route path="/yrlist" element={<List myList={myList} removeFromList={removeFromList} />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
};

export default App;
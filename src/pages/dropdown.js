
import React, { useState, useRef, useEffect } from 'react';

const UserDropdown = ({ user, onSignOut, onThemeToggle, isDarkMode = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user's initials for avatar
  const getUserInitials = () => {
    const displayName = user?.user_metadata?.display_name || user?.email || '';
    if (displayName.includes('@')) {
      return displayName.charAt(0).toUpperCase();
    }
    const names = displayName.split(' ');
    if (names.length > 1) {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  };

  // Get user's display name
  const getDisplayName = () => {
    const displayName = user?.user_metadata?.display_name;
    if (displayName) return displayName;
    return user?.email?.split('@')[0] || 'User';
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    window.location.href = '/profile';
  };

  const handleThemeClick = () => {
    onThemeToggle?.();
  };

  const handleSignOutClick = () => {
    console.log('UserDropdown sign out clicked');
    setIsOpen(false);
    onSignOut();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 p-2 rounded-lg ${
          isDarkMode 
            ? 'bg-gray-800 hover:bg-gray-700 border-gray-600 hover:border-gray-500' 
            : 'bg-blue-100 hover:bg-blue-200 border-blue-300 hover:border-blue-400'
        } border transition-all duration-200 group`}
      >
        {/* Avatar Circle */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold group-hover:from-blue-400 group-hover:to-purple-500 transition-all duration-200">
          {getUserInitials()}
        </div>
        
        {/* Name (hidden on mobile) */}
        <span className={`hidden md:block text-sm font-medium transition-colors ${
          isDarkMode 
            ? 'text-gray-200 group-hover:text-white' 
            : 'text-blue-800 group-hover:text-blue-900'
        }`}>
          {getDisplayName()}
        </span>
        
        {/* Dropdown Arrow */}
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${
            isDarkMode ? 'text-gray-400' : 'text-blue-600'
          } ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-56 ${
          isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-blue-100 border-blue-300'
        } border rounded-xl shadow-2xl z-50 overflow-hidden`}>
          {/* User Info Section */}
          <div className={`px-4 py-3 border-b ${
            isDarkMode ? 'border-gray-600 bg-gray-750' : 'border-blue-300 bg-blue-200'
          }`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {getUserInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  isDarkMode ? 'text-white' : 'text-blue-900'
                }`}>
                  {getDisplayName()}
                </p>
                <p className={`text-xs truncate ${
                  isDarkMode ? 'text-gray-400' : 'text-blue-600'
                }`}>
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Profile */}
            <button
              onClick={handleProfileClick}
              className={`w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-200 hover:text-white'
                  : 'hover:bg-blue-200 text-blue-800 hover:text-blue-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium">Profile</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={handleThemeClick}
              className={`w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-200 hover:text-white'
                  : 'hover:bg-blue-200 text-blue-800 hover:text-blue-900'
              }`}
            >
              {isDarkMode ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-sm font-medium">Light Mode</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-sm font-medium">Dark Mode</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className={`border-t my-2 ${
              isDarkMode ? 'border-gray-600' : 'border-blue-300'
            }`}></div>

            {/* Sign Out */}
            <button
              onClick={handleSignOutClick}
              className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-red-900 hover:bg-opacity-50 transition-colors text-red-400 hover:text-red-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
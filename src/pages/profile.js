import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const Profile = ({ user, isDarkMode = true, onThemeToggle }) => {
  // Form state - FIXED to match your schema
  const [profile, setProfile] = useState({
    username: '',
    display_name: '',
    avatar_url: '',
    bio: '',
    favorite_genres: [],
    location: '',
    website: '',
    birth_date: '',
    privacy_level: 'public'
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Movie genre options
  const genreOptions = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
    'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
  ];

  // Load user profile on component mount
  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Loading profile for user:', user.id);

      // FIXED: Query by 'id' and handle response properly
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      }

      console.log('Loaded profile data:', profileData);

      // Set profile data or defaults - FIXED to include all fields
      const existingProfile = profileData || {};
      setProfile({
        username: existingProfile.username || '',
        display_name: existingProfile.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || '',
        avatar_url: existingProfile.avatar_url || '',
        bio: existingProfile.bio || '',
        favorite_genres: existingProfile.favorite_genres || [],
        location: existingProfile.location || '',
        website: existingProfile.website || '',
        birth_date: existingProfile.birth_date || '',
        privacy_level: existingProfile.privacy_level || 'public'
      });

    } catch (error) {
      console.error('Failed to load profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenreToggle = (genre) => {
    setProfile(prev => ({
      ...prev,
      favorite_genres: prev.favorite_genres.includes(genre)
        ? prev.favorite_genres.filter(g => g !== genre)
        : [...prev.favorite_genres, genre]
    }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      // FIXED: Prepare profile data with correct field names
      const profileData = {
        id: user.id, // Use 'id' to match your schema
        username: profile.username.trim() || null,
        display_name: profile.display_name.trim() || null,
        avatar_url: profile.avatar_url.trim() || null,
        bio: profile.bio.trim() || null,
        favorite_genres: profile.favorite_genres.length > 0 ? profile.favorite_genres : null,
        location: profile.location.trim() || null,
        website: profile.website.trim() || null,
        birth_date: profile.birth_date || null,
        privacy_level: profile.privacy_level,
        updated_at: new Date().toISOString()
      };

      console.log('Saving profile data:', profileData);

      // FIXED: Use insert/update approach instead of upsert
      let { data, error: insertError } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select();

      if (insertError && insertError.code === '23505') {
        // Record already exists, so update it
        console.log('Profile exists, updating...');
        const { data: updateData, error: updateError } = await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('id', user.id)
          .select();
        
        if (updateError) {
          console.error('Update error details:', updateError);
          throw updateError;
        }
        data = updateData;
      } else if (insertError) {
        console.error('Insert error details:', insertError);
        throw insertError;
      }

      console.log('Profile saved successfully:', data);

      // Update auth user metadata if display name changed
      if (profile.display_name !== (user.user_metadata?.display_name || '')) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            display_name: profile.display_name
          }
        });

        if (updateError) {
          console.error('Failed to update auth metadata:', updateError);
        }
      }

      setMessage('Profile saved successfully!');
      setTimeout(() => setMessage(''), 3000);

    } catch (error) {
      console.error('Failed to save profile:', error);
      setError('Failed to save profile. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };



  if (!user) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'} py-8 transition-colors duration-300`}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="py-20">
            <div className="text-6xl mb-6">🔐</div>
            <h3 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-900'} mb-4`}>
              Sign in to view your profile
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-blue-600'} text-lg`}>
              Access your profile settings and preferences
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'} py-8 transition-colors duration-300`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-blue-600'}`}>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'} py-8 transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Messages */}
        {message && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
            ✅ {message}
          </div>
        )}
        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
            ❌ {error}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            {(profile.display_name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-900'} mb-2`}>
            Profile Settings
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-blue-600'}`}>
            Customize your MovieNote experience
          </p>
        </div>

        {/* Tabs */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-blue-100'} p-1 rounded-lg mb-8 flex transition-colors duration-300`}>
          {[
            { id: 'profile', label: 'Profile', icon: '👤' },
            { id: 'preferences', label: 'Preferences', icon: '⚙️' },
            { id: 'privacy', label: 'Privacy', icon: '🔒' },
            { id: 'account', label: 'Account', icon: '🏠' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : isDarkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-blue-700 hover:text-blue-900 hover:bg-blue-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-blue-100'} rounded-lg p-6 transition-colors duration-300`}>
          <form onSubmit={saveProfile}>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-blue-900'} mb-4`}>
                  Profile Information
                </h2>

                {/* Username */}
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-blue-700'} text-sm font-medium mb-2`}>
                    Username (Optional)
                  </label>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600 focus:border-purple-500'
                        : 'bg-blue-50 text-blue-900 border-blue-300 focus:border-purple-500'
                    }`}
                    placeholder="Your unique username"
                    maxLength={30}
                  />
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-blue-500'} mt-1`}>
                    This will be your unique identifier on MovieNote
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-blue-700'} text-sm font-medium mb-2`}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profile.display_name}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600 focus:border-purple-500'
                        : 'bg-blue-50 text-blue-900 border-blue-300 focus:border-purple-500'
                    }`}
                    placeholder="How should others see your name?"
                    maxLength={50}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-blue-700'} text-sm font-medium mb-2`}>
                    Bio
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600 focus:border-purple-500'
                        : 'bg-blue-50 text-blue-900 border-blue-300 focus:border-purple-500'
                    }`}
                    placeholder="Tell us a bit about yourself and your movie preferences..."
                    maxLength={500}
                  />
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-blue-500'} mt-1`}>
                    {profile.bio.length}/500 characters
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-blue-700'} text-sm font-medium mb-2`}>
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={profile.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600 focus:border-purple-500'
                        : 'bg-blue-50 text-blue-900 border-blue-300 focus:border-purple-500'
                    }`}
                    placeholder="e.g., New York, NY"
                    maxLength={100}
                  />
                </div>

                {/* Website */}
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-blue-700'} text-sm font-medium mb-2`}>
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600 focus:border-purple-500'
                        : 'bg-blue-50 text-blue-900 border-blue-300 focus:border-purple-500'
                    }`}
                    placeholder="https://your-website.com"
                  />
                </div>

                {/* Birth Date */}
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-blue-700'} text-sm font-medium mb-2`}>
                    Birth Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={profile.birth_date}
                    onChange={(e) => handleInputChange('birth_date', e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700 text-white border-gray-600 focus:border-purple-500'
                        : 'bg-blue-50 text-blue-900 border-blue-300 focus:border-purple-500'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-blue-900'} mb-4`}>
                  Movie Preferences
                </h2>

                {/* Favorite Genres */}
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-blue-700'} text-sm font-medium mb-3`}>
                    Favorite Genres (Select up to 5)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {genreOptions.map(genre => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => profile.favorite_genres.length < 5 || profile.favorite_genres.includes(genre) 
                          ? handleGenreToggle(genre) 
                          : null}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          profile.favorite_genres.includes(genre)
                            ? 'bg-purple-600 text-white'
                            : profile.favorite_genres.length >= 5
                            ? isDarkMode
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-200 text-blue-400 cursor-not-allowed'
                            : isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                        }`}
                        disabled={!profile.favorite_genres.includes(genre) && profile.favorite_genres.length >= 5}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-blue-500'} mt-2`}>
                    {profile.favorite_genres.length}/5 selected
                  </div>
                </div>

                {/* Theme Preference */}
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-blue-700'} text-sm font-medium mb-3`}>
                    Theme Preference
                  </label>
                  <button
                    type="button"
                    onClick={onThemeToggle}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg border transition-colors duration-300 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                        : 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    {isDarkMode ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        <span>Currently using Dark Mode - Click to switch to Light Mode</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span>Currently using Light Mode - Click to switch to Dark Mode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-blue-900'} mb-4`}>
                  Privacy Settings
                </h2>

                {/* Privacy Level */}
                <div>
                  <label className={`block ${isDarkMode ? 'text-gray-300' : 'text-blue-700'} text-sm font-medium mb-3`}>
                    Profile Visibility
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'public', label: 'Public', desc: 'Anyone can see your profile and watchlist' },
                      { value: 'friends', label: 'Friends Only', desc: 'Only approved friends can see your details' },
                      { value: 'private', label: 'Private', desc: 'Only you can see your profile' }
                    ].map(option => (
                      <label
                        key={option.value}
                        className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                          profile.privacy_level === option.value
                            ? 'bg-purple-600 text-white'
                            : isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name="privacy_level"
                          value={option.value}
                          checked={profile.privacy_level === option.value}
                          onChange={(e) => handleInputChange('privacy_level', e.target.value)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className={`text-sm ${
                            profile.privacy_level === option.value
                              ? 'text-purple-100'
                              : isDarkMode ? 'text-gray-400' : 'text-blue-600'
                          }`}>
                            {option.desc}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-blue-900'} mb-4`}>
                  Account Settings
                </h2>

                {/* Account Info */}
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                  <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-blue-900'} mb-2`}>
                    Account Information
                  </h3>
                  <div className={`space-y-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-700'}`}>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Account Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

             
              </div>
            )}

            {/* Save Button (not shown on Account tab) */}
            {activeTab !== 'account' && (
              <div className="flex justify-end pt-6 border-t border-gray-600">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
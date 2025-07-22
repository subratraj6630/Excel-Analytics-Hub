import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Navbar({ isAuthenticated, userId, onLogout }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const dropdownRef = useRef(null);

  // Auto-close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Apply dark mode class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleAccountDelete = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete your account and all data?');
    if (!confirmDelete) return;

    try {
      await axios.delete('http://127.0.0.1:5000/api/account', {
        headers: { Authorization: localStorage.getItem('token') }
      });
      alert('Account deleted successfully');
      onLogout();
    } catch (err) {
      alert('Error deleting account');
    }
  };

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-800 dark:text-white py-3.5 px-6 flex justify-between items-center fixed top-0 w-full z-50 shadow-md transition-colors duration-500">
      <img
        src="/logo2.png" // Adjust the path to your logo file (e.g., '/logo.png' or 'path/to/logo.png')
        alt="Excel Analytics Hub Logo"
        className="h-10 w-auto cursor-pointer hover:scale-150 hover:transition-transform"
      />
      <div className="space-x-4 flex items-center">
        <button
          onClick={() => {
            setShowDropdown(false);
            navigate('/');
          }}
          title="Go to Home"
          className="cursor-pointer px-4 py-1.75 rounded-full bg-gradient-to-r from-emerald-200 to-teal-300 text-gray-800 font-semibold transition-all duration-300 transform hover:scale-105 hover:drop-shadow-xl shadow-sm"
        >
          Home
        </button>
        <button
          onClick={() => {
            setShowDropdown(false);
            navigate('/dashboard');
          }}
          title="Open Dashboard"
          className="cursor-pointer px-4 py-1.75 rounded-full bg-gradient-to-r from-emerald-200 to-teal-300 text-gray-800 font-semibold transition-all duration-300 transform hover:scale-105 hover:drop-shadow-xl shadow-sm"
        >
          Dashboard
        </button>

        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              title="Profile"
              className="cursor-pointer w-11 h-11 rounded-full bg-gradient-to-r from-blue-200 to-indigo-300 flex items-center justify-center text-lg font-bold text-gray-900 transition-all duration-300 transform hover:scale-105 hover:drop-shadow-xl shadow-sm"
            >
              {userId?.charAt(0)?.toUpperCase()}
            </div>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-50 text-sm">
                <div className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300 border-b dark:border-gray-600">
                  {userId}
                </div>
                <div className="px-4 py-2 text-gray-800 dark:text-gray-200 border-b dark:border-gray-600">
                  <div className="font-semibold mb-1">Settings ⚙️</div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    Toggle {darkMode ? 'Light ☀️' : 'Dark 🌙'} Mode
                  </button>
                  <button
                    onClick={handleAccountDelete}
                    className="w-full text-left px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded cursor-pointer"
                  >
                    Delete Account ❌
                  </button>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-b-lg cursor-pointer"
                >
                  Logout 🔓
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            title="Login to your account"
            className="cursor-pointer px-4 py-1.75 rounded-full bg-gradient-to-r from-blue-300 to-indigo-400 text-gray-900 font-semibold transition-all duration-300 transform hover:scale-105 hover:drop-shadow-xl shadow-sm"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
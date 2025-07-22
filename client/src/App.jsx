import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import Navbar from './pages/Navbar.jsx';
import Home from './pages/Home.jsx';
import LoginRegister from './pages/LoginRegister.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Analytics from './pages/Analytics.jsx';
import DashboardAccessDenied from './pages/DashboardAccessDenied.jsx';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [latestUpload, setLatestUpload] = useState(null); // Track latest upload in session

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = token;
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      setLatestUpload(null); // Reset on initial load if no token
    }
  }, []);

  const handleLogin = (token, userId) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    axios.defaults.headers.common['Authorization'] = token;
    setIsAuthenticated(true);
    setLatestUpload(null); // Reset on login to start fresh
    window.location.href = '/';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    axios.defaults.headers.common['Authorization'] = null;
    setIsAuthenticated(false);
    setLatestUpload(null); // Reset on logout
    window.location.href = '/';
  };

  return (
    <Router>
      <Navbar
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        userId={localStorage.getItem('userId')}
      />
      <Routes>
        <Route
          path="/"
          element={
            <Home
              isAuthenticated={isAuthenticated}
              latestUpload={latestUpload}
              setLatestUpload={setLatestUpload}
            />
          }
        />
        <Route path="/login" element={<LoginRegister onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <DashboardAccessDenied />}
        />
        <Route path="/analytics/:uploadId" element={<Analytics />} />
      </Routes>
    </Router>
  );
}

export default App;
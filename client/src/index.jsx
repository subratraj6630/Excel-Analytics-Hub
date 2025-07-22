import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './ThemeContext.jsx'; // ✅ Import Theme Context

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ThemeProvider> {/* ✅ Wrap App with ThemeProvider */}
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

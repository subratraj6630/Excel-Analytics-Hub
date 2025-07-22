import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';

function DashboardAccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-rose-100 via-emerald-100 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      
      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-center px-6 text-center">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-10 max-w-xl w-full">
          <h1 className="text-4xl font-bold text-red-600 dark:text-red-400 mb-4">
            🚫 Access Denied
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            You must be logged in to access the dashboard.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 px-6 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Go to Login / Register
          </button>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default DashboardAccessDenied;

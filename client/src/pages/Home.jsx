import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';

function Home({ isAuthenticated, latestUpload, setLatestUpload }) {
  const [file, setFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [loginPrompt, setLoginPrompt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFileError('❌ File size exceeds 5MB limit!');
      setTimeout(() => setFileError(''), 4000);
      return;
    }

    setFile(selectedFile);

    if (isAuthenticated) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const response = await axios.post('http://127.0.0.1:5000/api/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: localStorage.getItem('token'),
          },
        });

        // Update latestUpload in App.jsx
        setLatestUpload({
          _id: response.data.upload._id,
          fileName: response.data.upload.fileName,
          uploadDate: response.data.upload.uploadDate,
          userId: response.data.upload.userId,
        });

        setIsUploading(false);
        setSuccessMessage('File uploaded successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          setFile(null);
        }, 3000);
      } catch (error) {
        console.log('Upload error:', error);
        alert('Error uploading file: ' + (error.response?.data?.message || error.message));
        setIsUploading(false);
      }
    }
  };

  const handleCardClick = () => {
    if (isAuthenticated) {
      fileInputRef.current.click();
    } else {
      setLoginPrompt('Please login to upload files');
      setTimeout(() => setLoginPrompt(''), 3000);
    }
  };

  const handleAiCardClick = () => {
    setAiMessage('🚧 Coming soon');
    setTimeout(() => setAiMessage(''), 3000);
  };

  const handleAnalyticsCardClick = () => {
    if (!isAuthenticated) {
      setLoginPrompt('Please login to view analytics');
      setTimeout(() => setLoginPrompt(''), 3000);
      return;
    }

    if (!latestUpload) {
      setLoginPrompt('No uploads in this session. Please upload a file or visit Dashboard for previous uploads.');
      setTimeout(() => setLoginPrompt(''), 3000);
      return;
    }

    navigate(`/analytics/${latestUpload._id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 via-emerald-200 to-teal-300 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900 text-gray-800 dark:text-white transition-colors duration-500">
      <div className="flex-grow flex flex-col items-center justify-start px-6 pt-8 pb-16">
        <div className="text-center py-12 max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-green-900 via-purple-600 to-pink-500 text-transparent bg-clip-text">
            Excel Analytics Hub
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-300 leading-relaxed">
            Transform your spreadsheets into actionable insights with beautiful visualizations and AI-powered analysis
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 mt-6 mb-10">
            {/* 100% Data Accuracy */}
            <div className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-bold px-6 py-3 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800/60 text-center transition-transform hover:scale-[1.03] hover:shadow-xl">
              <div className="text-lg">100%</div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Accuracy</div>
            </div>

            {/* 5x Faster Analysis */}
            <div className="bg-white dark:bg-gray-800 text-pink-600 dark:text-pink-400 font-bold px-6 py-3 rounded-2xl shadow-lg border border-green-200 dark:border-emerald-800/60 text-center transition-transform hover:scale-[1.03] hover:shadow-xl">
              <div className="text-lg">5x</div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Faster Analysis</div>
            </div>

            {/* AI Powered Insights */}
            <div className="bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 font-bold px-6 py-3 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-800/60 text-center transition-transform hover:scale-[1.03] hover:shadow-xl">
              <div className="text-lg">AI</div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Powered Insights</div>
            </div>
          </div>
        </div>

        {loginPrompt && (
          <div className="mb-4 text-red-600 font-semibold bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-2 px-4 rounded-full shadow">
            {loginPrompt}
          </div>
        )}

        {fileError && (
          <div className="mb-4 text-red-600 font-semibold bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-2 px-4 rounded-full shadow">
            {fileError}
          </div>
        )}

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full mb-16">
          {/* Upload Files */}
          <div
            onClick={!isUploading ? handleCardClick : undefined}
            className={`relative bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800/60 p-6 rounded-2xl shadow-lg text-center transition-all duration-300 cursor-pointer hover:scale-[1.03] hover:shadow-xl ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
            <div className="bg-blue-100 dark:bg-blue-900/40 w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 truncate">
              {isUploading ? 'Uploading...' : latestUpload ? `${latestUpload.fileName}` : 'Upload Files'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              {isUploading ? 'Processing your file...' : 'Upload Excel sheets and see instant previews.'}
            </p>
            <div className="text-xs text-blue-500 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 rounded-full px-3 py-1 inline-block">
              .xlsx, .xls, .csv
            </div>
            <input
              type="file"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx,.xls,.csv"
              disabled={isUploading}
            />
          </div>

          {/* View Analytics */}
          <div
            onClick={handleAnalyticsCardClick}
            className="relative bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-emerald-900/30 border border-green-200 dark:border-emerald-800/60 p-6 rounded-2xl shadow-lg text-center transition-all duration-300 cursor-pointer hover:scale-[1.03] hover:shadow-xl"
          >
            <div className="bg-green-100 dark:bg-emerald-900/40 w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">View Analytics</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Generate visual charts from your Excel data instantly.
            </p>
            <div className="text-xs text-green-500 dark:text-emerald-400 font-medium bg-green-50 dark:bg-emerald-900/30 rounded-full px-3 py-1 inline-block">
              Interactive Dashboards
            </div>
          </div>

          {/* AI Insights */}
          <div
            onClick={handleAiCardClick}
            className="relative bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-violet-900/30 border border-purple-200 dark:border-violet-800/60 p-6 rounded-2xl shadow-lg text-center transition-all duration-300 cursor-pointer hover:scale-[1.03] hover:shadow-xl"
          >
            <div className="bg-purple-100 dark:bg-violet-900/40 w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-purple-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Insights</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Generate intelligent summaries of your data using AI.
            </p>
            {aiMessage && (
              <div className="mt-3 text-purple-500 dark:text-violet-400 font-semibold">{aiMessage}</div>
            )}
            <div className="text-xs text-purple-500 dark:text-violet-400 font-medium bg-purple-50 dark:bg-violet-900/30 rounded-full px-3 py-1 inline-block">
              Beta Preview
            </div>
          </div>
        </div>

        {/* Upload Success */}
        {successMessage && (
          <div className="bg-green-500/90 text-white font-semibold text-center text-lg py-3 px-6 rounded-full shadow-lg backdrop-blur-sm">
            {successMessage}
          </div>
        )}

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-6">Ready to transform your data?</h3>
          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            className="cursor-pointer bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Home;
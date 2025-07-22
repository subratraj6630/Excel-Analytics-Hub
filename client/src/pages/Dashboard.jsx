import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Footer from './Footer';

function Dashboard() {
  const [uploads, setUploads] = useState([]);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('http://127.0.0.1:5000/api/uploads', {
        headers: { Authorization: token },
      })
      .then((response) => setUploads(response.data))
      .catch((error) => console.log('Error fetching uploads:', error));
  }, [token]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:5000/api/uploads/${id}`, {
        headers: { Authorization: token },
      });
      setUploads(uploads.filter((upload) => upload._id !== id));
    } catch (error) {
      console.log('Error deleting upload:', error);
    }
  };

  const handleAnalytics = (uploadId) => {
    navigate(`/analytics/${uploadId}`);
  };

  const handleAIInsights = (fileName) => {
    // Placeholder for AI insights functionality
    alert(`AI Insights for ${fileName} will be implemented here.`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-gray-700 via-gray-800 to-gray-900">
      <div className="flex-grow p-6 pt-24">
        <h2 className="text-4xl font-bold text-center text-white mb-10 animate-fade-in-up">
          📊 Dashboard – Upload History
        </h2>

        {uploads.length > 0 ? (
          <div className="space-y-6">
            {uploads.map((upload) => (
              <div
                key={upload._id}
                className="bg-white/70 backdrop-blur-lg border border-blue-200 shadow-md rounded-xl p-4 transition-all duration-300 transform hover:scale-[1.015] hover:shadow-xl animate-fade-in-up"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-800">{upload.fileName}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Uploaded on: {new Date(upload.uploadDate).toLocaleString()} | User: {upload.userId}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAnalytics(upload._id)}
                      className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600 transition cursor-pointer"
                    >
                      Analytics
                    </button>
                    <button
                      onClick={() => handleAIInsights(upload.fileName)}
                      className="bg-purple-500 text-white px-4 py-1 rounded-md hover:bg-purple-600 transition cursor-pointer"
                    >
                      AI Insights
                    </button>
                    <button
                      onClick={() => handleDelete(upload._id)}
                      className="bg-red-500 text-white px-4 py-1 rounded-md hover:bg-red-600 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-300 text-center mt-20 text-lg">No uploads yet.</p>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Dashboard;
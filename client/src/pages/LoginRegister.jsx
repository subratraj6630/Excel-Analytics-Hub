import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginRegister({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();

  // ✅ Same strict rules for both login and register
  const usernameValid = /[0-9]/.test(username) && /[!@#$%^&*(),.?":{}|<>]/.test(username);
  const passwordValid = /[!@#$%^&*(),.?":{}|<>]/.test(password) && password.length >= 6;
  const isFormValid = usernameValid && passwordValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isLogin ? '/api/login' : '/api/register';
    try {
      const res = await axios.post(`http://127.0.0.1:5000${url}`, { username, password });
      if (isLogin) {
        //onLogin(res.data.token);
        onLogin(res.data.token, res.data.userId); // ✅ Send both token & userId
      } else {
        setSuccessMessage(res.data.message || 'User registered successfully');
        setIsRedirecting(true);
        setUsername('');
        setPassword('');
        setError('');

        setTimeout(() => {
          setIsLogin(true);
          setSuccessMessage('');
          setIsRedirecting(false);
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-emerald-100 to-cyan-200 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900 transition-colors duration-500 px-4">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-2xl backdrop-blur-md bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white tracking-tight">
          {isLogin ? 'Welcome Back 👋' : 'Create an Account ✨'}
        </h2>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-300 dark:border-red-700">
            {error}
            <button
              className="float-right text-sm text-red-600 dark:text-red-300"
              onClick={() => setError('')}
            >
              ✖
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 flex items-center gap-2 rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-300 dark:border-green-700">
            ✅ {successMessage} — redirecting to login...
            {isRedirecting && (
              <svg className="animate-spin h-5 w-5 text-green-600 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-2 pr-8 border rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <span
              className={`absolute top-9 right-3 w-3 h-3 rounded-full cursor-pointer ${
                usernameValid ? 'bg-green-500' : 'bg-green-100'
              }`}
              title="Username must contain at least one number and one special character"
            />
          </div>

          <div className="relative">
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 pr-8 border rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            <span
              className={`absolute top-9 right-3 w-3 h-3 rounded-full cursor-pointer ${
                passwordValid ? 'bg-green-500' : 'bg-green-100'
              }`}
              title="Password must be at least 6 characters and contain one special character"
            />
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`cursor-pointer w-full py-2 px-4 text-white font-semibold rounded-lg shadow-md transition-all duration-300 ${
              isFormValid
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:scale-105'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          
<button
  onClick={() => {
    setIsLogin(!isLogin);
    setUsername('');
    setPassword('');
    setError('');
    setSuccessMessage('');
    setIsRedirecting(false);
  }}

            className="cursor-pointer text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginRegister;

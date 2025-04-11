import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, User } from 'lucide-react';

const BASE_URL = "http://localhost:5000";
// const BASE_URL = "https://crossword-game-ca-backend.vercel.app";

const LoginForm: React.FC = () => {
  const [sroNumber, setSroNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBanned) return;
    setIsLoading(true);
    setError('');
    
    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/login`, {
        sroNumber,
        password,
      });

      // Store token, isAdmin flag, and userId in localStorage (these remain for session management)
      localStorage.setItem('token', data.token);
      localStorage.setItem('isAdmin', JSON.stringify(data.isAdmin));
      localStorage.setItem('userId', data._id); // using _id as userId

      // Navigate based on the isAdmin flag
      if (data.isAdmin) {
        navigate('/admin/panel');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      // If the backend sends a termination message, display it.
      setError(err.response?.data?.message || 'An error occurred during login.');
      // Set isBanned to true if termination is indicated.
      if (err.response?.data?.message?.toLowerCase().includes("terminated")) {
        setIsBanned(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full max-w-md px-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
            <KeyRound size={32} className="text-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-6 text-center text-white">
          {isBanned ? "Access Denied" : "Welcome Back"}
        </h2>
        <p className="text-gray-400 text-center mb-8">
          {isBanned ? "Your account has been terminated." : "Sign in to your crossword puzzle account"}
        </p>
        
        {error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-800 rounded-md">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {/* Disable form if banned */}
        <form onSubmit={handleSubmit} className={isBanned ? "pointer-events-none opacity-50" : ""}>
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-300">Student Registration Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User size={18} className="text-gray-500" />
              </div>
              <input
                type="text"
                value={sroNumber}
                onChange={(e) => setSroNumber(e.target.value)}
                className="w-full py-3 pl-10 pr-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter Student Reg number"
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-300">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <KeyRound size={18} className="text-gray-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 pl-10 pr-10 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || isBanned}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-lg transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;

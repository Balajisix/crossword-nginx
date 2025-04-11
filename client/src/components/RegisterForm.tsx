import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, User, UserPlus, AlertCircle, Mail, Phone } from 'lucide-react';

const BASE_URL = "https://crossword-game-ca-backend.vercel.app";
// const BASE_URL = "http://localhost:5000";

const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [sroNumber, setSroNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validatePasswords = () => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordsMatch(false);
      return false;
    } else {
      setPasswordsMatch(true);
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/register`, { 
        name, 
        sroNumber, 
        email,
        phoneNumber,
        password 
      });
      
      // Store token and navigate to Home page after successful registration
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data._id || data.userId);
      navigate('/home');
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during registration.');
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
            <UserPlus size={32} className="text-white" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-6 text-center text-white">Create Account</h2>
        <p className="text-gray-400 text-center mb-8">Join our crossword puzzle community</p>
        
        {error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-800 rounded-md">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-300">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User size={18} className="text-gray-500" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full py-3 pl-10 pr-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>
          
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

          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-300">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Mail size={18} className="text-gray-500" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 pl-10 pr-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email address"
                required
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block mb-2 text-sm font-medium text-gray-300">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Phone size={18} className="text-gray-500" />
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full py-3 pl-10 pr-3 rounded-lg bg-gray-700/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your phone number"
                required
              />
            </div>
          </div>
          
          <div className="mb-5">
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
                placeholder="Create password"
                required
                minLength={6}
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
          
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-300">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <KeyRound size={18} className="text-gray-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (e.target.value) validatePasswords();
                }}
                onBlur={validatePasswords}
                className={`w-full py-3 pl-10 pr-3 rounded-lg bg-gray-700/50 border ${
                  !passwordsMatch ? "border-red-500" : "border-gray-600"
                } text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="Confirm password"
                required
                minLength={6}
              />
            </div>
            {!passwordsMatch && (
              <p className="mt-2 text-red-400 text-sm flex items-center">
                <AlertCircle size={14} className="mr-1" />
                Passwords do not match
              </p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !passwordsMatch}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-lg transition-all font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;

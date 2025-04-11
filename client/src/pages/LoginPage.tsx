import React from 'react';
import LoginForm from '../components/LoginForm';
import { Link } from 'react-router-dom';
import { Puzzle } from 'lucide-react';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-900 to-gray-950 text-white p-4">
      <div className="w-full max-w-md text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Puzzle className="text-blue-500" size={32} />
          <h1 className="text-3xl font-bold">Crossword Puzzle</h1>
        </div>
        <p className="text-gray-400">Challenge your mind with our crossword puzzles</p>
      </div>
      
      <LoginForm />
      
      <div className="mt-8 text-center">
        <p className="text-gray-400">
          Not registered yet?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
            Create an account
          </Link>
        </p>
      </div>
      
      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Crossword Puzzle Game. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LoginPage;
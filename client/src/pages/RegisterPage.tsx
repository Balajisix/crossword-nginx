import React from 'react';
import RegisterForm from '../components/RegisterForm';
import { Link } from 'react-router-dom';
import { Puzzle } from 'lucide-react';

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-gray-900 to-gray-950 text-white p-4">
      <div className="w-full max-w-md text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Puzzle className="text-blue-500" size={32} />
          <h1 className="text-3xl font-bold">Crossword Puzzle</h1>
        </div>
        <p className="text-gray-400">Join our community of crossword enthusiasts</p>
      </div>
      
      <RegisterForm />
      
      <div className="mt-8 text-center">
        <p className="text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
            Sign in now
          </Link>
        </p>
      </div>
      
      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Crossword Puzzle Game. All rights reserved.</p>
      </footer>
      </div>
  );
};

export default RegisterPage;
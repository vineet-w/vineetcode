import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ArrowUpRight } from 'lucide-react';
import { Button } from '../components/Button';
import './AuthPage.css';

export function AuthPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-montserrat bg-darkgray flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Added Go To Zymo link */}
      <div className="absolute top-6 left-6">
        <a 
          href="https://zymo.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white hover:text-lime-400 transition-all duration-200 text-sm border border-gray-600 hover:border-lime-400"
        >
          Go To Zymo
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
 
      <div className="max-w-md w-full space-y-8 ">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-lime-400 p-4 rounded-full animate-pulse">
              <Car className="h-16 w-16 text-lime" />
            </div>
          </div>
          <h2 className="mt-6 text-4xl font-extrabold text-lime">
            <div className='flex flex-col justify-center'>
              <div>Welcome to</div>
              <h1 className="text-5xl mt-2">ZYMO PARTNER</h1>
            </div>
          </h2>
          <p className="mt-4 text-sm text-white sentence-animation">
            {Array.from("Your trusted platform for car rentals").map((letter, index) => (
              <span 
                key={index} 
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {letter === " " ? "\u00A0" : letter}
              </span>
            ))}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Button
            fullWidth
            onClick={() => navigate('/login')}
            className="py-3 text-lime hover:bg-lime-900 transition-colors duration-300"
          >
            Sign In
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => navigate('/signup')}
            className="py-3 !bg-lime hover:!bg-lime-600 transition-colors duration-300"
          >
            Create Account
          </Button>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car } from 'lucide-react';
import { Button } from '../components/Button';
import './AuthPage.css'; // Import custom CSS for animation

export function AuthPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen font-montserrat bg-darkgray flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-lime-400 p-4 rounded-full">
              <Car className="h-16 w-16 text-lime" />
            </div>
          </div>
          <h2 className="flex text-center mt-6 text-4xl font-extrabold  text-lime">
            <div className='flex flex-col justify-center w-screen'><div>Welcome to 
            </div>
            <div>ZYMO PARTNER</div></div>
          </h2>
          <p className="mt-2 text-sm text-white sentence-animation">
            {Array.from("Your trusted platform for car rentals").map((letter, index) => (
              <span key={index} style={{ animationDelay: `${index * 0.1}s` }}
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
            className="py-3 text-lime"
          >
            Sign In
          </Button>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => navigate('/signup')}
            className="py-3 !bg-lime"
          >
            Create Account
          </Button>
        </div>
      </div>
    </div>
  );
}
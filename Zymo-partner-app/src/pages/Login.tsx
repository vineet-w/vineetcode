import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Car } from 'lucide-react';
import { auth } from '../lib/firebase';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Eye, EyeOff } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Add constants for email and password
  const ADMIN_EMAIL = 'tech@zymo.app';
  const ADMIN_PASSWORD = 'admin123';

  const handleTogglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible); // Toggle password visibility
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
        // Check if the input fields match the admin credentials
        if (formData.email === ADMIN_EMAIL && formData.password === ADMIN_PASSWORD) {
          navigate('/admin');
          setIsLoading(false);
          return;
        }
        try {
          await signInWithEmailAndPassword(auth, formData.email, formData.password);
          navigate('/home');
        } catch (err) {
          setError('Invalid email or password');
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <div className="min-h-screen bg-darkgray font-montserrat flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center">
              <div className="bg-lime p-3 rounded-full">
                <Car className="h-12 w-12 text-lightgray" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-lime">
              Welcome back
            </h2>
            <p className="mt-2 text-center text-sm text-white">
              Sign in to access your account
            </p>
          </div>
    
          <div className="mt-8 max-w-md w-full">
            <div className="bg-darkgray py-8 px-4 rounded-2xl border border-lime text-white">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
    
                <Input
                  id="email"
                  label="Email address"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e: { target: { value: any; }; }) => setFormData({ ...formData, email: e.target.value })}
                />
    
                <div className="relative">
                  <Input
                    id="password"
                    label="Password"
                    type={isPasswordVisible ? 'text' : 'password'} // Toggle between password and text
                    required
                    value={formData.password}
                    onChange={(e: { target: { value: any; }; }) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={handleTogglePasswordVisibility}
                    className="absolute right-3 top-11 transform -translate-y-1/2 text-gray-500"
                    aria-label="Toggle password visibility"
                  >
                    {isPasswordVisible ? (
                      <EyeOff className="h-6 w-6" />
                    ) : (
                      <Eye className="h-6 w-6" />
                    )}
                  </button>
                </div>
    
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Link to="/forgot-password" className="font-medium p-2 text-lime hover:text-lime/80">
                      Forgot your password?
                    </Link>
                  </div>
                </div>
                <div className='flex justify-center'>   
                  <Button type="submit" className='items-center hover:bg-lime/80 text-black w-[240px] bg-lime' fullWidth isLoading={isLoading}>
                    Sign in
                  </Button>
                </div>
                <div className="text-sm text-center">
                  <Link to="/signup" className="font-medium text-white underline hover:text-lime">
                    Don't have an account? Sign up
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }
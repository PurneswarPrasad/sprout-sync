import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuthStatus = async () => {
      try {
        const response = await authAPI.status();
        
        if (response.data.success && response.data.authenticated) {
          // User is already authenticated, redirect to home page
          navigate('/home');
        }
      } catch (error) {
        // User is not authenticated, stay on landing page
        console.log('User not authenticated');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  const handleGoogleSignIn = () => {
    // Redirect to backend OAuth endpoint
    authAPI.googleAuth();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-200 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 lg:px-8">
        {/* Top spacing for mobile */}
        <div className="pt-8 sm:pt-12 lg:pt-16"></div>

         {/* Header */}
         <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl sm:text-4xl">🌱</span>
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4 sm:mb-6 leading-tight px-2">
            Nurture your plants,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
              nurture yourself
            </span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            Transform your plant care journey into a mindful ritual. Track, learn, and grow alongside your green companions with our intuitive plant care app.
          </p>
        </div>

        {/* Sign In Button - Fixed consistent size */}
        <div className="text-center mb-8 sm:mb-12">
          <button
            onClick={handleGoogleSignIn}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <div className="relative flex items-center space-x-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Sign in with Google</span>
            </div>
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            Join thousands of plant lovers already growing with us
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 max-w-6xl mx-auto">
          <div className="text-center p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-xl sm:text-2xl">📅</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Smart Scheduling</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Never miss a watering or feeding with personalized care reminders</p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-xl sm:text-2xl">📸</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Plant Identification</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Identify unknown plants and get expert care tips instantly</p>
          </div>

          <div className="text-center p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <span className="text-xl sm:text-2xl">📊</span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Growth Tracking</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Monitor your plants' progress and celebrate their milestones</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pb-8 text-center">
          <p className="text-xs sm:text-sm text-gray-400">
            Made with 🌱 for plant enthusiasts
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
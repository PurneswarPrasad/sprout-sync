import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { authAPI } from '../services/api';
import { Footer } from '../components/Footer';
import { InstallPromptBanner } from '../components/InstallPromptBanner';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showFloatingHeader, setShowFloatingHeader] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { scrollYProgress } = useScroll();
  
  // Transform scroll progress to create gentle gradient shifts
  const backgroundOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.6, 0.8]);
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show header when scrolling down past 200px
      if (currentScrollY > 200 && currentScrollY > lastScrollY) {
        setShowFloatingHeader(true);
      }
      // Hide header when scrolling up or at the top (but keep it visible at the very top)
      else if (currentScrollY < lastScrollY && currentScrollY > 50) {
        setShowFloatingHeader(false);
      }
      // Always show at the very top
      else if (currentScrollY <= 50) {
        setShowFloatingHeader(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Install Prompt Banner */}
      <InstallPromptBanner />
      
      {/* Floating Header */}
      <motion.div 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${showFloatingHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: showFloatingHeader ? 0 : -100, opacity: showFloatingHeader ? 1 : 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
      >
        <div className="bg-gradient-to-br from-green-50/90 via-emerald-50/90 to-teal-50/90 backdrop-blur-sm border-b border-green-200/30 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Left side - Logo and Name */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <motion.div 
                  className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br rounded-lg flex items-center justify-center"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <span className="text-sm sm:text-lg"><img src="/SproutSync_logo.png" alt="SproutSync" className="w-6 h-6 sm:w-8 sm:h-8" /></span>
                </motion.div>
                <span className="text-lg sm:text-xl font-bold text-gray-800">SproutSync</span>
              </div>

              {/* Center - Beginner-friendly tagline */}
              <div className="flex-1 flex justify-center px-2">
                <motion.button 
                  className="text-xs sm:text-sm text-green-700 hover:bg-green-100 hover:border-green-300 border border-transparent px-2 sm:px-3 py-1 rounded-lg transition-all duration-200 cursor-pointer text-center whitespace-nowrap"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="hidden sm:inline">Newsletter coming soon! Click </span>
                  <span className="sm:hidden">Newsletter coming soon! <br/>Click </span>
                  <span className="font-bold">here</span>
                  <span className="sm:inline"> to sign up.</span>
                </motion.button>
              </div>

              {/* Right side - Empty for balance */}
              <div className="w-8 sm:w-24"></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Background decorative elements with gentle motion */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full opacity-30 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 20, 0],
            y: [0, -10, 0]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-200 rounded-full opacity-25 blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.25, 0.4, 0.25],
            x: [0, -15, 0],
            y: [0, 15, 0]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-200 rounded-full opacity-15 blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 lg:px-8">
        {/* Top spacing for mobile */}
        <div className="pt-8 sm:pt-12 lg:pt-16"></div>

        {/* Header */}
        <motion.div 
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4 sm:mb-6 leading-tight px-2"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            Start small, grow big,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600">
              never give up!
            </span>
          </motion.h1>

          <motion.p 
            className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          >
            Your first plant is waiting for you! <br/>We'll guide you every step of the way
            with <br/><b>gentle reminders</b>, <b>helpful tips</b>, and the <b>confidence to succeed</b>.<br /><br/>
            <span className="text-green-700 font-medium">No green thumb needed — just a caring heart ❤️</span>
          </motion.p>
        </motion.div>

        {/* Sign In Button - Fixed consistent size */}
        <motion.div 
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
        >
          <motion.button
            onClick={handleGoogleSignIn}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300"
            whileHover={{ 
              scale: 1.05,
              y: -2,
              transition: { type: "spring", damping: 15, stiffness: 300 }
            }}
            whileTap={{ 
              scale: 0.98,
              transition: { type: "spring", damping: 20, stiffness: 400 }
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <div className="relative flex items-center space-x-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Sign in with Google</span>
            </div>
          </motion.button>

          <motion.p 
            className="text-sm text-green-600 mt-4 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
          >
            Your green journey starts here 🌿
          </motion.p>
        </motion.div>

        {/* Features */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-green-100/50 overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            viewport={{ once: true }}
            whileHover={{ 
              y: -5,
              transition: { type: "spring", damping: 15, stiffness: 300 }
            }}
          >
            <motion.div 
              className="w-full h-48 sm:h-56"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src="/calendar_landingpage.png"
                alt="Never Forget to Water"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="p-4 sm:p-6 text-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Never Forget to Water</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Gentle reminders that build caring habits, not stress. Perfect for busy beginners!</p>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-green-100/50 overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
            whileHover={{ 
              y: -5,
              transition: { type: "spring", damping: 15, stiffness: 300 }
            }}
          >
            <motion.div 
              className="w-full h-48 sm:h-56"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src="/AIidentify_landingpage.png"
                alt="Know Your First Plant"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="p-4 sm:p-6 text-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Know Your First Plant</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Snap a photo and instantly discover what you're caring for. No guesswork needed!</p>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-green-100/50 overflow-hidden sm:col-span-2 lg:col-span-1"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            viewport={{ once: true }}
            whileHover={{ 
              y: -5,
              transition: { type: "spring", damping: 15, stiffness: 300 }
            }}
          >
            <motion.div 
              className="w-full h-48 sm:h-56"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src="/growth_landingpage.png"
                alt="See Your Plant Thrive"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="p-4 sm:p-6 text-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">See Your Plant Thrive</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">Watch your confidence grow as your plant does. Every new leaf is a victory!</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default LandingPage;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { submitOnboardingData, getOrCreateUserId } from '../utils/onboarding';

interface OnboardingState {
  plantExperience: string;
  plantLocation: string[];
  plantGoals: string[];
  timeCommitment: string;
  lightCondition: string;
  petsOrKids: string;
  avoidPreferences: string[];
  appFeatures: string[];
}

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<OnboardingState>({
    plantExperience: '',
    plantLocation: [],
    plantGoals: [],
    timeCommitment: '',
    lightCondition: '',
    petsOrKids: '',
    avoidPreferences: [],
    appFeatures: []
  });

  // Question data
  const questions = {
    1: {
      title: "How has your luck been with plants so far?",
      subtitle: "Be honest — we'll help from there.",
      type: "single-select" as const,
      options: [
        { id: "never-owned", label: "Never owned one", description: "Totally new", icon: "🌱" },
        { id: "tried-before", label: "Tried before, had mixed results", description: "Some survived", icon: "🤞" },
        { id: "kept-few", label: "Kept a few alive", description: "I know basics", icon: "👍" },
        { id: "confident", label: "Confident / experienced", description: "I know care routines", icon: "🌿" }
      ],
      hasSkip: true
    },
    2: {
      title: "Where will your plants live?",
      subtitle: "Pick all that apply.",
      type: "multi-select" as const,
      options: [
        { id: "indoors", label: "Indoors (room/desk)", icon: "🏠" },
        { id: "balcony", label: "Balcony / patio", icon: "🌤️" },
        { id: "outdoor", label: "Garden / yard", icon: "🌳" }
      ],
      hasSkip: true
    },
    3: {
      title: "What do you want from plants?",
      subtitle: "Pick any — we'll prioritise recommendations.",
      type: "multi-select" as const,
      options: [
        { id: "low-maint", label: "Easy, low-maintenance", icon: "🪴" },
        { id: "decor", label: "Look & decor", icon: "✨" },
        { id: "air", label: "Cleaner air / health", icon: "🌿" },
        { id: "hobby", label: "Learn & grow as a hobby", icon: "📚" },
        { id: "gift", label: "Gifts / sharing plants", icon: "🎁" }
      ],
      hasSkip: true
    },
    4: {
      title: "How much time can you spend on plants?",
      subtitle: "This helps match care level.",
      type: "single-select" as const,
      options: [
        { id: "very-little", label: "Very little — <15 min/week", description: "I'll forget often", icon: "⏱️" },
        { id: "some", label: "A bit — 15–60 min/week", description: "I can check now & then", icon: "🕒" },
        { id: "regular", label: "Regular — few hours/week", description: "I'll do weekly care", icon: "🧰" },
        { id: "all-in", label: "I love spending time", description: "I'll care often & learn", icon: "💚" }
      ],
      hasSkip: true
    },
    5: {
      title: "How much light does the spot get?",
      subtitle: "Think about where you'll keep your plants.",
      type: "single-select" as const,
      options: [
        { id: "bright-direct", label: "Bright, direct sun (south/window)", icon: "☀️" },
        { id: "bright-indirect", label: "Bright but indirect light", icon: "🌤️" },
        { id: "low-light", label: "Low / shady spot", icon: "🌥️" },
        { id: "varies", label: "Light varies day-to-day", icon: "🔄" }
      ],
      hasSkip: true
    },
    6: {
      title: "Do you have pets or small children to consider?",
      subtitle: "We'll avoid toxic plants if needed.",
      type: "single-select" as const,
      options: [
        { id: "no-pets", label: "No, nothing to worry about", icon: "✅" },
        { id: "pets", label: "Yes — pets (cats/dogs)", icon: "🐶🐱" },
        { id: "kids", label: "Yes — young children", icon: "🧒" },
        { id: "both", label: "Both pets & kids", icon: "👪🐾" }
      ],
      hasSkip: true
    },
    7: {
      title: "Anything you'd rather avoid?",
      subtitle: "Helps filter recommended plants.",
      type: "multi-select" as const,
      options: [
        { id: "toxic", label: "Toxic plants", icon: "⚠️" },
        { id: "big", label: "Large / fast-growing plants", icon: "🌲" },
        { id: "messy", label: "Plants that drop lots of leaves", icon: "🍂" },
        { id: "fragrant", label: "Strong fragrance", icon: "🌸" },
        { id: "no-preference", label: "No preference", icon: "✅" }
      ],
      hasSkip: true
    },
    8: {
      title: "What help would you like from the app?",
      subtitle: "Pick what you want to use.",
      type: "multi-select" as const,
      options: [
        { id: "reminders", label: "Water & care reminders", icon: "⏰" },
        { id: "identify", label: "Identify plants from photos", icon: "🔍" },
        { id: "sick-help", label: "Help for sick plants", icon: "🩺" },
        { id: "journal", label: "Keep a plant journal", icon: "📓" },
        { id: "community", label: "Connect with other beginners", icon: "💬" }
      ],
      hasSkip: true
    }
  };

  useEffect(() => {
    // Check if user is already authenticated AND has completed onboarding
    const checkAuthStatus = async () => {
      try {
        const response = await authAPI.status();

        if (response.data.success && response.data.authenticated) {
          // If user is authenticated and has already submitted onboarding, redirect to home
          const hasCompletedOnboarding = localStorage.getItem('onboarding-submitted') === 'true';
          if (hasCompletedOnboarding) {
            navigate('/home');
            return;
          }
        }
      } catch (error) {
        // User is not authenticated, continue with onboarding
        console.log('User not authenticated, proceeding with onboarding');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
    // Initialize user ID
    getOrCreateUserId();
  }, [navigate]);

  const handleMultiSelect = (currentStep: number, optionId: string) => {
    const propertyMap: Record<number, keyof OnboardingState> = {
      2: 'plantLocation',
      3: 'plantGoals',
      7: 'avoidPreferences',
      8: 'appFeatures'
    };
    
    const propertyName = propertyMap[currentStep];
    const currentAnswers = answers[propertyName] as string[];
    const newAnswers = currentAnswers.includes(optionId)
      ? currentAnswers.filter(id => id !== optionId)
      : [...currentAnswers, optionId];
    
    setAnswers(prev => ({
      ...prev,
      [propertyName]: newAnswers
    }));
  };

  const handleSingleSelect = (currentStep: number, optionId: string) => {
    const propertyMap: Record<number, keyof OnboardingState> = {
      1: 'plantExperience',
      4: 'timeCommitment',
      5: 'lightCondition',
      6: 'petsOrKids'
    };
    
    const propertyName = propertyMap[currentStep];
    setAnswers(prev => ({
      ...prev,
      [propertyName]: optionId
    }));
  };

  const handleNext = () => {
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    // Clear the current answer
    const clearMap: Record<number, Partial<OnboardingState>> = {
      1: { plantExperience: '' },
      2: { plantLocation: [] },
      3: { plantGoals: [] },
      4: { timeCommitment: '' },
      5: { lightCondition: '' },
      6: { petsOrKids: '' },
      7: { avoidPreferences: [] },
      8: { appFeatures: [] }
    };
    
    if (clearMap[currentStep]) {
      setAnswers(prev => ({
        ...prev,
        ...clearMap[currentStep]
      }));
    }
    
    // If it's the last question, submit instead of moving to next step
    if (currentStep === 8) {
      handleContinue();
    } else if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleContinue = async () => {
    setSubmitting(true);
    
    // Submit all onboarding data before navigating
    await submitOnboardingData({
      plantExperience: answers.plantExperience,
      plantLocation: answers.plantLocation,
      plantGoals: answers.plantGoals,
      timeCommitment: answers.timeCommitment,
      lightCondition: answers.lightCondition,
      petsOrKids: answers.petsOrKids,
      avoidPreferences: answers.avoidPreferences,
      appFeatures: answers.appFeatures
    });
    
    navigate('/signin');
  };

  const canProceed = () => {
    const question = questions[currentStep as keyof typeof questions];
    
    if (question.type === 'multi-select') {
      const propertyMap: Record<number, keyof OnboardingState> = {
        2: 'plantLocation',
        3: 'plantGoals',
        7: 'avoidPreferences',
        8: 'appFeatures'
      };
      const propertyName = propertyMap[currentStep];
      const answer = answers[propertyName] as string[];
      return answer && answer.length > 0;
    } else {
      const propertyMap: Record<number, keyof OnboardingState> = {
        1: 'plantExperience',
        4: 'timeCommitment',
        5: 'lightCondition',
        6: 'petsOrKids'
      };
      const propertyName = propertyMap[currentStep];
      const answer = answers[propertyName] as string;
      return answer && answer !== '';
    }
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

  const currentQuestion = questions[currentStep as keyof typeof questions];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Background decorative elements */}
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
      </div>

      <div className="relative z-10 flex flex-col min-h-screen px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between pt-8 sm:pt-12 pb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors duration-200"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-2">
            <img src="/SproutSync_logo.png" alt="SproutSync" className="w-8 h-8" />
            <span className="text-lg font-bold text-gray-800">SproutSync</span>
          </div>
          
          <div className="w-10"></div> {/* Spacer for balance */}
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
              <div
                key={step}
                className={`w-8 h-2 rounded-full transition-colors duration-300 ${
                  step <= currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">{currentStep}/8</p>
        </div>

        {/* Question content */}
        <motion.div 
          className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full"
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="text-center mb-8">
            <motion.h1 
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {currentQuestion.title}
            </motion.h1>
            {currentQuestion.subtitle && (
              <motion.p 
                className="text-gray-600 text-base sm:text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {currentQuestion.subtitle}
              </motion.p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3 sm:space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => {
              let isSelected = false;
              
              if (currentQuestion.type === 'multi-select') {
                const multiSelectMap: Record<number, keyof OnboardingState> = {
                  2: 'plantLocation',
                  3: 'plantGoals',
                  7: 'avoidPreferences',
                  8: 'appFeatures'
                };
                const propertyName = multiSelectMap[currentStep];
                isSelected = (answers[propertyName] as string[]).includes(option.id);
              } else {
                const singleSelectMap: Record<number, keyof OnboardingState> = {
                  1: 'plantExperience',
                  4: 'timeCommitment',
                  5: 'lightCondition',
                  6: 'petsOrKids'
                };
                const propertyName = singleSelectMap[currentStep];
                isSelected = (answers[propertyName] as string) === option.id;
              }

              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  {currentQuestion.type === 'multi-select' ? (
                    <button
                      onClick={() => handleMultiSelect(currentStep, option.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${
                        isSelected 
                          ? 'bg-green-50 border-green-300 shadow-md' 
                          : 'bg-white border-gray-200 hover:border-green-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{(option as any).icon}</span>
                        <span className="text-gray-800 font-medium">{option.label}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSingleSelect(currentStep, option.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                        isSelected 
                          ? 'bg-green-50 border-green-300 shadow-md' 
                          : 'bg-white border-gray-200 hover:border-green-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{(option as any).icon}</span>
                        <div className="flex-1 text-left">
                          <h3 className={`font-semibold text-base ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>
                            {option.label}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">{(option as any).description}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Action buttons */}
          <motion.div 
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {currentQuestion.hasSkip ? (
              <button
                onClick={handleSkip}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:rounded-lg font-medium transition-all duration-200"
              >
                Skip
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex space-x-3">
              {currentStep < 8 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    canProceed()
                      ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleContinue}
                  disabled={!canProceed()}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    canProceed()
                      ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Submit
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Submission Loading Overlay */}
      {submitting && (
        <motion.div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <p className="text-gray-800 text-lg font-medium">Optimising your experience...</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default OnboardingPage;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { submitOnboardingData, getOrCreateUserId } from '../utils/onboarding';

interface OnboardingState {
  plantLocation: string[];
  helpWith: string[];
  interestLevel: string;
  skillLevel: string;
}

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<OnboardingState>({
    plantLocation: [],
    helpWith: [],
    interestLevel: '',
    skillLevel: ''
  });

  // Question data
  const questions = {
    1: {
      title: "Where are your plants?",
      subtitle: "You can pick multiple options.",
      type: "multi-select" as const,
      options: [
        { id: "indoor", label: "Potted plants indoor", icon: "🏠" },
        { id: "outdoor", label: "Potted plants outdoor", icon: "🪴" },
        { id: "garden", label: "Garden, plants in ground", icon: "🌳" }
      ],
      hasSkip: true
    },
    2: {
      title: "What can we help you with?",
      subtitle: "You can pick multiple options.",
      type: "multi-select" as const,
      options: [
        { id: "sick-plant", label: "Get help with a sick plant", icon: "🩺" },
        { id: "reminders", label: "Get water and care reminders", icon: "🚿" },
        { id: "identify", label: "Identify a plant", icon: "🔍" },
        { id: "journal", label: "Plant organization & journal", icon: "📝" },
        { id: "something-else", label: "Something else", icon: "⋯" }
      ],
      hasSkip: true
    },
    3: {
      title: "How interested are you in plant care?",
      subtitle: "",
      type: "single-select" as const,
      options: [
        { id: "low", label: "Low", description: "I just want to keep my plants alive", image: "/Sansevieria trifasciata 1.jpg" },
        { id: "medium", label: "Medium", description: "I like plant care and I'm alright with spending time on my plants", image: "/Philodendron-Cordatum-Hanging-Expressions-upright-aspect-ratio-360-460.webp" },
        { id: "high", label: "High", description: "I live for plants. I want to spend every waking hour on them", image: "/advanced.png" }
      ],
      hasSkip: false
    },
    4: {
      title: "How good are you at taking care of plants?",
      subtitle: "",
      type: "single-select" as const,
      options: [
        { id: "hopeless", label: "Hopeless", description: "The only plants that's still alive are the ones that never lived", image: "/hopeless.jpg" },
        { id: "beginner", label: "Beginner", description: "Every now and then I manage to keep a cactus alive", image: "/beginner.jpg" },
        { id: "experienced", label: "Experienced", description: "I have my plants under control, we are alright", image: "/experienced.webp" },
        { id: "skilled", label: "Skilled", description: "What I don't know about plants is not worth knowing", image: "/skilled.webp" },
        { id: "master", label: "Master", description: "The name says it all!", image: "/Gemini_Generated_Image_xsq2w0xsq2w0xsq2.png" }
      ],
      hasSkip: false
    }
  };

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
    const propertyName = currentStep === 1 ? 'plantLocation' : 'helpWith';
    const currentAnswers = answers[propertyName];
    const newAnswers = currentAnswers.includes(optionId)
      ? currentAnswers.filter(id => id !== optionId)
      : [...currentAnswers, optionId];
    
    setAnswers(prev => ({
      ...prev,
      [propertyName]: newAnswers
    }));
  };

  const handleSingleSelect = (currentStep: number, optionId: string) => {
    const propertyName = currentStep === 3 ? 'interestLevel' : 'skillLevel';
    setAnswers(prev => ({
      ...prev,
      [propertyName]: optionId
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    if (currentStep === 1 || currentStep === 2) {
      // Clear answers for the current question before skipping
      if (currentStep === 1) {
        setAnswers(prev => ({
          ...prev,
          plantLocation: []
        }));
      } else if (currentStep === 2) {
        setAnswers(prev => ({
          ...prev,
          helpWith: []
        }));
      }
      
      // Skip to question 3
      setCurrentStep(3);
    }
  };

  const handleContinue = () => {
    // Submit all onboarding data before navigating
    submitOnboardingData({
      plantLocation: answers.plantLocation,
      helpWith: answers.helpWith,
      interestLevel: answers.interestLevel,
      skillLevel: answers.skillLevel
    });
    
    navigate('/signin');
  };

  const canProceed = () => {
    const question = questions[currentStep as keyof typeof questions];
    if (question.type === 'multi-select') {
      // Multi-select questions require at least one selection to proceed
      const propertyName = currentStep === 1 ? 'plantLocation' : 'helpWith';
      const answer = answers[propertyName];
      return answer && answer.length > 0;
    } else {
      // Single-select questions require a selection
      const propertyName = currentStep === 3 ? 'interestLevel' : 'skillLevel';
      const answer = answers[propertyName];
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
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-8 h-2 rounded-full transition-colors duration-300 ${
                  step <= currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">{currentStep}/4</p>
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
              const isSelected = currentQuestion.type === 'multi-select'
                ? (currentStep === 1 ? answers.plantLocation : answers.helpWith).includes(option.id)
                : (currentStep === 3 ? answers.interestLevel : answers.skillLevel) === option.id;

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
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img 
                            src={(option as any).image} 
                            alt={option.label}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to a placeholder if image doesn't exist
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className={`font-semibold text-lg ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>
                            {option.label}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">{(option as any).description}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
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
              {currentStep < 4 ? (
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
                  Continue
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingPage;

import React, { useEffect, useState, useRef } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import sprayingAnimation from '../../assets/animations/spraying.json';
import spraying2Animation from '../../assets/animations/spraying-2.json';

interface SprayingAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

/**
 * SprayingAnimation Component
 * 
 * A reusable component that plays two Lottie animations sequentially when a spraying task is completed.
 * 
 * Features:
 * - Sequential animation playback (spraying → spraying-2)
 * - 1.5x speed for both animations
 * - Smooth fade-in/fade-out transitions
 * - Responsive design for mobile screens
 * - Background fade effect during animation
 * - Scale-up effect for animations
 */
const SprayingAnimation: React.FC<SprayingAnimationProps> = ({ show, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showFirstAnimation, setShowFirstAnimation] = useState(false);
  const [showSecondAnimation, setShowSecondAnimation] = useState(false);
  const sprayingRef = useRef<any>(null);
  const spraying2Ref = useRef<any>(null);

  const getDurationMs = (data: any, speed: number) => {
    try {
      const fr = Number(data?.fr ?? 30);
      const ip = Number(data?.ip ?? 0);
      const op = Number(data?.op ?? 0);
      const seconds = Math.max(0, (op - ip) / fr);
      return (seconds / speed) * 1000;
    } catch {
      return 3000;
    }
  };

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setShowFirstAnimation(true);
      setShowSecondAnimation(false);

      // Start first animation at 2x speed
      requestAnimationFrame(() => {
        sprayingRef.current?.setSpeed(2);
      });

      // Calculate when first animation finishes
      const firstAnimationMs = getDurationMs(sprayingAnimation as any, 2);
      const exitAnimationDuration = 300; // Corresponds to animationVariants.exit.transition.duration * 1000
      
      // Hide first animation and show second after exit transition
      const timer1 = setTimeout(() => {
        setShowFirstAnimation(false); // Hide first animation
        // Wait for the exit animation to complete before showing the second
        setTimeout(() => {
          setShowSecondAnimation(true); // Show second animation
          // Start second animation at 1.5x speed
          requestAnimationFrame(() => {
            spraying2Ref.current?.setSpeed(1.5);
          });
        }, exitAnimationDuration); // Delay for the first animation to fade out
      }, firstAnimationMs);

      // Calculate total time including second animation
      const secondAnimationMs = getDurationMs(spraying2Animation as any, 1.5);
      const totalMs = firstAnimationMs + exitAnimationDuration + secondAnimationMs;

      const completeTimer = setTimeout(() => {
        setIsVisible(false);
        setShowFirstAnimation(false);
        setShowSecondAnimation(false);
        onComplete?.();
      }, Math.ceil(totalMs) + 350); // add small fade buffer

      return () => {
        clearTimeout(timer1);
        clearTimeout(completeTimer);
      };
    } else {
      setIsVisible(false);
      setShowFirstAnimation(false);
      setShowSecondAnimation(false);
    }
  }, [show, onComplete]);

  // Animation variants for smooth transitions
  const containerVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.8,
    },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.3,
        ease: [0.55, 0.06, 0.68, 0.19] as const
      }
    }
  };

  const backgroundVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 0.3,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const animationVariants = {
    hidden: { 
      opacity: 0,
      scale: 0.9,
    },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.2,
        ease: [0.55, 0.06, 0.68, 0.19] as const
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Background overlay with fade effect */}
          <motion.div
            className="absolute inset-0 bg-black"
            variants={backgroundVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          />
          
          {/* Animation container */}
          <div className="relative z-10 flex items-center justify-center">
            <AnimatePresence>
              {/* First spraying animation - centered */}
              {showFirstAnimation && (
                <motion.div
                  key="spraying"
                  className="flex items-center justify-center"
                  variants={animationVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
                    <Lottie
                      lottieRef={sprayingRef}
                      animationData={sprayingAnimation}
                      loop={false}
                      autoplay={true}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Second spraying animation - centered, only shows after first */}
              {showSecondAnimation && (
                <motion.div
                  key="spraying2"
                  className="flex items-center justify-center"
                  variants={animationVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
                    <Lottie
                      lottieRef={spraying2Ref}
                      animationData={spraying2Animation}
                      loop={false}
                      autoplay={true}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SprayingAnimation;



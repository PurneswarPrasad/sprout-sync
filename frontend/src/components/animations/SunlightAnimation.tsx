import React, { useEffect, useState, useRef } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import sunAnimation from '../../assets/animations/sun.json';
import sun2Animation from '../../assets/animations/sun-2.json';

interface SunlightAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

/**
 * SunlightAnimation Component
 * 
 * A reusable component that plays two Lottie animations sequentially when a sunlight rotation task is completed.
 * 
 * Features:
 * - Sequential animation playback (sun → sun-2)
 * - 1.5x speed for both animations
 * - Smooth fade-in/fade-out transitions
 * - Responsive design for mobile screens
 * - Background fade effect during animation
 * - Scale-up effect for animations
 */
const SunlightAnimation: React.FC<SunlightAnimationProps> = ({ show, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sunRef = useRef<any>(null);
  const sun2Ref = useRef<any>(null);

  useEffect(() => {
    if (show) {
      setIsVisible(true);

      // Ensure both animations run at specified speeds
      requestAnimationFrame(() => {
        sunRef.current?.setSpeed(1.0);
        sun2Ref.current?.setSpeed(4.0);
      });

      // Set total animation time to 4 seconds
      const totalMs = 4000;

      const completeTimer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, totalMs);

      return () => {
        clearTimeout(completeTimer);
      };
    } else {
      setIsVisible(false);
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
            {/* Sun animation - shifted to the LEFT and moves UP */}
            <motion.div
              key="sun"
              className="absolute right-[40%] translate-x-1/3 -translate-y-10 flex items-center justify-center"
              initial={{ opacity: 0, scale: 1, y: 0 }}
              animate={{ opacity: 1, scale: 0.8, y: -80 }}  // 👈 goes up & shrinks
              exit={{ opacity: 0, scale: 0.8, y: -80 }}
              transition={{
                duration: 0.8,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80">
                <Lottie
                  lottieRef={sunRef}
                  animationData={sunAnimation}
                  loop={false}
                  autoplay={true}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </motion.div>
              {/* Sun-2 animation - centered */}
              <motion.div
                key="sun2"
                className="flex items-center justify-center"
                variants={animationVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
                  <Lottie
                    lottieRef={sun2Ref}
                    animationData={sun2Animation}
                    loop={false}
                    autoplay={true}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SunlightAnimation;



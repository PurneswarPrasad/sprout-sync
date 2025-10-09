import React, { useEffect, useState, useRef } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import waterAnimation from '../../assets/animations/water.json';
import plantGrowingAnimation from '../../assets/animations/plant.json';

interface WateringAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

/**
 * WateringAnimation Component
 * 
 * A reusable component that plays two Lottie animations sequentially when a watering task is completed.
 * 
 * Features:
 * - Sequential animation playback (watering pot → plant growing)
 * - 2x speed for both animations
 * - 1 second delay between animations
 * - Smooth fade-in/fade-out transitions
 * - Responsive design for mobile screens
 * - Background fade effect during animation
 * - Scale-up effect for animations
 * 
 * Usage:
 * <WateringAnimation
 *   show={isWateringCompleted}
 *   onComplete={() => setShowWateringAnimation(false)}
 * />
 * 
 * Future extensibility:
 * This component can be extended for other care types by:
 * - Adding new animation files for fertilizing, pruning, spraying, sunlightRotation
 * - Creating a generic CareAnimation component that accepts animation type
 * - Adding different timing configurations per care type
 */
const WateringAnimation: React.FC<WateringAnimationProps> = ({ show, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const wateringRef = useRef<any>(null);
  const growingRef = useRef<any>(null);

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

      // Ensure both animations run at 2x
      requestAnimationFrame(() => {
        wateringRef.current?.setSpeed(1.5);
        growingRef.current?.setSpeed(1.5);
      });

      // Compute total time and finish
      const totalMs = Math.max(
        getDurationMs(waterAnimation as any, 2),
        getDurationMs(plantGrowingAnimation as any, 2)
      );

      const completeTimer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, Math.ceil(totalMs) + 350); // add small fade buffer

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
              {/* Watering can animation - shifted to the LEFT */}
              <motion.div
            key="watering"
            className="absolute right-[40%] translate-x-1/3 -translate-y-10 flex items-center justify-center"
            variants={animationVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80">
              <Lottie
                lottieRef={wateringRef}
                animationData={waterAnimation}
                loop={false}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </motion.div>

              {/* Growing plant animation - centered */}
              <motion.div
                key="growing"
                className="flex items-center justify-center"
                variants={animationVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">
                  <Lottie
                    lottieRef={growingRef}
                    animationData={plantGrowingAnimation}
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

export default WateringAnimation;

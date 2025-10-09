import React, { useEffect, useState, useRef } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import scanAnimation from '../../assets/animations/Scan.json';

interface ScannerAnimationProps {
  show: boolean;
  onComplete?: () => void;
}

/**
 * ScannerAnimation Component
 * 
 * A component that plays a scanning animation overlay on images during AI analysis.
 * 
 * Features:
 * - Scanning animation overlay with grid pattern
 * - Smooth fade-in/fade-out transitions
 * - Responsive design
 * - Loops continuously while analysis is running
 * - Duration matches the analysis time (controlled by show prop)
 * 
 * Usage:
 * <ScannerAnimation
 *   show={isAnalyzing}
 *   onComplete={() => console.log('Scan complete')}
 * />
 */
const ScannerAnimation: React.FC<ScannerAnimationProps> = ({ show, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const scanRef = useRef<any>(null);

  const getDurationMs = (data: any, speed: number) => {
    try {
      const fr = Number(data?.fr ?? 30);
      const ip = Number(data?.ip ?? 0);
      const op = Number(data?.op ?? 0);
      const seconds = Math.max(0, (op - ip) / fr);
      return (seconds / speed) * 1000;
    } catch {
      return 2000; // Default 2 seconds
    }
  };

  useEffect(() => {
    if (show) {
      setIsVisible(true);

      // Set animation speed and make it loop
      requestAnimationFrame(() => {
        scanRef.current?.setSpeed(1);
        scanRef.current?.setLoop(true);
      });
    } else {
      setIsVisible(false);
      onComplete?.();
    }
  }, [show, onComplete]);

  // Animation variants for smooth transitions
  const containerVariants = {
    hidden: { 
      opacity: 0,
    },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: [0.55, 0.06, 0.68, 0.19] as const
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Semi-transparent overlay */}
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Scanner animation */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-full h-full max-w-md">
              <Lottie
                lottieRef={scanRef}
                animationData={scanAnimation}
                loop={true}
                autoplay={true}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScannerAnimation;

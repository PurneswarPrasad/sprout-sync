import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface SwipeToDeleteCardProps {
  children: React.ReactNode;
  onDelete: () => void;
  threshold?: number;
  className?: string;
}

export interface SwipeToDeleteCardRef {
  reset: () => void;
}

export const SwipeToDeleteCard = forwardRef<SwipeToDeleteCardRef, SwipeToDeleteCardProps>(({
  children,
  onDelete,
  threshold = 100,
  className = '',
}, ref) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, -threshold], [1, 0]);
  const scale = useTransform(x, [0, -threshold], [1, 0.95]);
  const backgroundOpacity = useTransform(x, [0, -threshold], [0, 1]);

  const handleDragEnd = async (event: any, info: PanInfo) => {
    if (info.offset.x < -threshold) {
      // Swipe passed threshold, trigger delete animation
      setIsDeleting(true);
      
      // Animate off screen
      await new Promise(resolve => {
        x.set(-window.innerWidth);
        setTimeout(resolve, 300);
      });
      
      // Trigger delete function
      onDelete();
    } else {
      // Swipe didn't pass threshold, snap back
      x.set(0);
    }
  };

  // Reset function to be called when delete is cancelled
  const reset = () => {
    setIsDeleting(false);
    x.set(0);
  };

  // Expose reset function to parent component
  useImperativeHandle(ref, () => ({
    reset
  }));

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Delete background */}
      <motion.div 
        className="absolute inset-0 bg-red-500 flex items-center justify-center"
        style={{ opacity: backgroundOpacity }}
      >
        <motion.div
          animate={{ scale: [0.8, 1.2, 1] }}
          transition={{ duration: 0.3 }}
        >
          <Trash2 className="w-8 h-8 text-white" />
        </motion.div>
      </motion.div>
      
      {/* Swipeable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x, opacity, scale }}
        className="relative z-10 bg-white rounded-xl shadow-sm border border-gray-200"
        animate={isDeleting ? { x: -window.innerWidth } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {children}
      </motion.div>
    </div>
  );
});

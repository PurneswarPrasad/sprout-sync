import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface NewUserFocusProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export const NewUserFocus: React.FC<NewUserFocusProps> = ({ isVisible, onDismiss }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Show tooltip after a brief delay for better UX
      const timer = setTimeout(() => setShowTooltip(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowTooltip(false);
    }
  }, [isVisible]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss();
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Dark overlay covering the entire screen */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300"
        onClick={handleOverlayClick}
      >
        {/* Highlighted area around the + button */}
        <div className="absolute bottom-20 right-4 w-16 h-16 sm:bottom-24">
          {/* Glowing ring around the button */}
          <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-pulse scale-150"></div>
          <div className="absolute inset-0 rounded-full bg-emerald-300/20 animate-pulse scale-125"></div>
          
          {/* Tooltip */}
          {showTooltip && (
            <div className="absolute bottom-20 right-0 mb-2 animate-bounce">
              <div className="bg-white rounded-xl shadow-2xl border-2 border-emerald-300 px-5 py-4 w-48">
                <div className="flex items-start gap-3">
                  <p className="text-sm font-semibold text-gray-800 leading-snug flex-1">
                    Click here to meet your plant buddies!
                  </p>
                  <button
                    onClick={handleOverlayClick}
                    className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 -mt-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Arrow pointing down to the button */}
                <div className="absolute top-full right-6 -mt-px">
                  <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
                </div>
                <div className="absolute top-full right-6 -mt-0.5">
                  <div className="w-0 h-0 border-l-[9px] border-r-[9px] border-t-[9px] border-transparent border-t-emerald-300"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced + button with extra highlighting */}
      <button
        onClick={handleButtonClick}
        className="fixed bottom-20 right-4 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl hover:bg-emerald-700 transition-all duration-300 flex items-center justify-center z-[70] sm:bottom-24 ring-4 ring-emerald-300 ring-opacity-75 animate-pulse"
        style={{
          boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.3), 0 0 20px rgba(16, 185, 129, 0.5), 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </>
  );
};

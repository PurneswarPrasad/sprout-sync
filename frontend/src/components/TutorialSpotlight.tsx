import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export interface TutorialSpotlightProps {
  isVisible: boolean;
  targetRef: React.RefObject<HTMLElement>;
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  onSkip: () => void;
  onNext?: () => void;
  isLastStep?: boolean;
  padding?: number;
}

export const TutorialSpotlight: React.FC<TutorialSpotlightProps> = ({
  isVisible,
  targetRef,
  message,
  position = 'right',
  onSkip,
  onNext,
  isLastStep = false,
  padding = 8,
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isVisible && targetRef.current) {
      const updateRect = () => {
        const rect = targetRef.current?.getBoundingClientRect();
        if (rect) {
          setTargetRect(rect);
        }
      };

      updateRect();
      
      // Add a small delay after initial render to ensure correct positioning
      const timeoutId = setTimeout(updateRect, 100);
      
      window.addEventListener('resize', updateRect);
      window.addEventListener('scroll', updateRect);
      window.addEventListener('orientationchange', updateRect);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', updateRect);
        window.removeEventListener('scroll', updateRect);
        window.removeEventListener('orientationchange', updateRect);
      };
    }
  }, [isVisible, targetRef]);

  if (!isVisible || !targetRect) return null;

  // Calculate message box position
  const getMessageBoxStyle = (): React.CSSProperties => {
    const isMobile = window.innerWidth < 640; // sm breakpoint
    const messageBoxWidth = isMobile ? window.innerWidth - 32 : 320; // Full width on mobile with padding
    const messageBoxOffset = 20;

    let style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 10002,
      width: isMobile ? `${messageBoxWidth}px` : `${messageBoxWidth}px`,
      maxWidth: isMobile ? 'calc(100vw - 32px)' : '320px',
    };

    // On mobile, always position at top of highlighted element
    if (isMobile) {
      const spaceAbove = targetRect.top - padding;
      const spaceBelow = window.innerHeight - (targetRect.bottom + padding);
      
      // If there's more space above, position above; otherwise position below
      if (spaceAbove > 200 || spaceAbove > spaceBelow) {
        // Position above the highlighted element
        style.left = '16px'; // 16px padding from sides
        style.bottom = `${window.innerHeight - targetRect.top + padding + messageBoxOffset}px`;
      } else {
        // Position below the highlighted element
        style.left = '16px'; // 16px padding from sides
        style.top = `${targetRect.bottom + padding + messageBoxOffset}px`;
      }
    } else {
      // Desktop positioning logic
      switch (position) {
        case 'right':
          style.left = `${targetRect.right + messageBoxOffset}px`;
          style.top = `${targetRect.top + targetRect.height / 2}px`;
          style.transform = 'translateY(-50%)';
          break;
        case 'left':
          style.right = `${window.innerWidth - targetRect.left + messageBoxOffset}px`;
          style.top = `${targetRect.top + targetRect.height / 2}px`;
          style.transform = 'translateY(-50%)';
          break;
        case 'top':
          style.left = `${targetRect.left + targetRect.width / 2}px`;
          style.bottom = `${window.innerHeight - targetRect.top + messageBoxOffset}px`;
          style.transform = 'translateX(-50%)';
          break;
        case 'bottom':
          style.left = `${targetRect.left + targetRect.width / 2}px`;
          style.top = `${targetRect.bottom + messageBoxOffset}px`;
          style.transform = 'translateX(-50%)';
          break;
      }
    }

    return style;
  };

  const handleAction = () => {
    if (onNext) {
      onNext();
    } else {
      onSkip();
    }
  };

  return (
    <>
      {/* Overlay with cutout */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 10000 }}
      >
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="12"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.6)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>

      {/* Highlighted area border (pulsing effect) */}
      <div
        className="fixed pointer-events-none animate-pulse"
        style={{
          zIndex: 10001,
          left: `${targetRect.left - padding}px`,
          top: `${targetRect.top - padding}px`,
          width: `${targetRect.width + padding * 2}px`,
          height: `${targetRect.height + padding * 2}px`,
          border: '3px solid rgb(16, 185, 129)',
          borderRadius: '12px',
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
        }}
      />

      {/* Message box */}
      <div
        style={getMessageBoxStyle()}
        className="bg-white rounded-2xl shadow-2xl p-5 animate-bounce-gentle max-h-[80vh] overflow-y-auto"
      >
        <div className="mb-4">
          <p className="text-gray-800 text-base leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
          >
            Skip
          </button>
          <button
            onClick={handleAction}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors active:bg-emerald-800"
          >
            {isLastStep ? 'Done' : 'Next'}
          </button>
        </div>
      </div>

      {/* Custom CSS for bounce animation */}
      <style>{`
        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(-50%) scale(1);
          }
          50% {
            transform: translateY(-50%) scale(1.02);
          }
        }
        
        @keyframes bounce-gentle-mobile {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
        
        @media (max-width: 640px) {
          .animate-bounce-gentle {
            animation: bounce-gentle-mobile 2s ease-in-out infinite;
          }
        }
      `}</style>
    </>
  );
};


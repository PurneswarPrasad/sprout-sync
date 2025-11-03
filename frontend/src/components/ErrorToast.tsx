import React, { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';

export interface ErrorToastProps {
  message: string;
  details?: string;
  onClose: () => void;
  autoCloseMs?: number;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  details,
  onClose,
  autoCloseMs = 15000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto close
    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseMs);

    return () => clearTimeout(timer);
  }, [autoCloseMs]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  const handleCopy = async () => {
    const textToCopy = details ? `${message}\n\nDetails: ${details}` : message;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div
      className={`fixed top-20 right-4 max-w-sm w-full bg-red-50 border border-red-200 rounded-lg shadow-2xl overflow-hidden z-50 transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="bg-red-100 rounded-full p-2">
              <X className="w-5 h-5 text-red-600" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-900 mb-1">Notification Error</p>
            <p className="text-sm text-red-800 break-words">{message}</p>
            {details && (
              <p className="text-xs text-red-700 mt-2 font-mono break-all">{details}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-start space-x-1">
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
              title={copied ? 'Copied!' : 'Copy error message'}
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors p-1.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-red-100">
        <div
          className="h-full bg-red-600 transition-all ease-linear"
          style={{
            width: isVisible ? '0%' : '100%',
            transitionDuration: `${autoCloseMs}ms`,
          }}
        />
      </div>
    </div>
  );
};

// Container for multiple error toasts
export const ErrorToastContainer: React.FC<{
  errors: Array<{
    id: string;
    message: string;
    details?: string;
  }>;
  onDismiss: (id: string) => void;
}> = ({ errors, onDismiss }) => {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      {errors.map((error, index) => (
        <div
          key={error.id}
          className="pointer-events-auto"
          style={{ transform: `translateY(${index * 10}px)` }}
        >
          <ErrorToast
            message={error.message}
            details={error.details}
            onClose={() => onDismiss(error.id)}
          />
        </div>
      ))}
    </div>
  );
};


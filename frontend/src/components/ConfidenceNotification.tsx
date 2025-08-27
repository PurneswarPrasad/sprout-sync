import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ConfidenceNotificationProps {
  confidence: number;
  isVisible: boolean;
  onClose: () => void;
}

export const ConfidenceNotification: React.FC<ConfidenceNotificationProps> = ({
  confidence,
  isVisible,
  onClose,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return 'text-green-600 bg-green-50 border-green-200';
    if (conf >= 0.8) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (conf >= 0.7) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getConfidenceText = (conf: number) => {
    if (conf >= 0.9) return 'Very High';
    if (conf >= 0.8) return 'High';
    if (conf >= 0.7) return 'Good';
    return 'Fair';
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-9 right-4 z-50 transition-all duration-300 ease-in-out ${
        isAnimating ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className={`max-w-sm p-4 rounded-xl border shadow-lg ${getConfidenceColor(confidence)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">
                Predicted with {Math.round(confidence * 100)}% accuracy
              </p>
              <p className="text-sm opacity-80">
                Confidence: {getConfidenceText(confidence)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

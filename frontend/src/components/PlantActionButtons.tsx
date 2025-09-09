import React, { useState, useRef, useEffect } from 'react';
import { Plus, Activity, FileText } from 'lucide-react';

interface PlantActionButtonsProps {
  plantName: string;
  onTrackPlant: () => void;
  onMonitorHealth: () => void;
}

export const PlantActionButtons: React.FC<PlantActionButtonsProps> = ({
  plantName,
  onTrackPlant,
  onMonitorHealth,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleBackButton = () => {
      if (isOpen) {
        setIsOpen(false);
        return true; // Prevent default back behavior
      }
      return false;
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      
      // Handle Android back button
      const handlePopState = () => {
        if (isOpen) {
          setIsOpen(false);
          // Push a new state to prevent going back
          window.history.pushState(null, '', window.location.href);
        }
      };
      
      window.addEventListener('popstate', handlePopState);
      // Push a new state when modal opens
      window.history.pushState(null, '', window.location.href);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleTrackPlant = () => {
    setIsOpen(false);
    onTrackPlant();
  };

  const handleMonitorHealth = () => {
    setIsOpen(false);
    onMonitorHealth();
  };

  // Cleanup function to handle history state
  useEffect(() => {
    return () => {
      // Clean up any pushed history states when component unmounts
      if (isOpen) {
        window.history.back();
      }
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={handleToggle}
        className="w-16 h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Text below button */}
      <p className="text-center text-sm text-gray-600 mt-2 font-medium">
        Keep track of your plant
      </p>

      {/* Dropdown Options */}
      {isOpen && (
        <>
          {/* Background overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40" 
            onClick={() => setIsOpen(false)}
            onTouchStart={() => setIsOpen(false)}
          />
          
          {/* Modal content */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div 
              className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[280px] max-w-[90vw] mx-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
          <button
            onClick={handleTrackPlant}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-800">Track your plant</div>
              <div className="text-sm text-gray-500">Add notes and photos</div>
            </div>
          </button>
          
          <button
            onClick={handleMonitorHealth}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Activity className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-800">Monitor plant health</div>
              <div className="text-sm text-gray-500">Check for diseases</div>
            </div>
          </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};


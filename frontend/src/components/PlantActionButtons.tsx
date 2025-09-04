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

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={handleToggle}
        className="w-16 h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Text below button */}
      <p className="text-center text-sm text-gray-600 mt-2 font-medium">
        Post {plantName}'s update
      </p>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-10">
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
      )}
    </div>
  );
};


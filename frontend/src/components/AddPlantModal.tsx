import React from 'react';
import { Camera, PenTool, X, Heart } from 'lucide-react';

interface AddPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManualEntry: () => void;
  onCameraID: () => void;
  onCheckHealth?: () => void;
}

export const AddPlantModal: React.FC<AddPlantModalProps> = ({
  isOpen,
  onClose,
  onManualEntry,
  onCameraID,
  onCheckHealth,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Add New Plant</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <button
            onClick={onCameraID}
            className="w-full p-4 border-2 border-emerald-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Camera className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">Camera ID</h3>
              <p className="text-sm text-gray-600">AI-powered plant identification</p>
            </div>
          </button>

          <button
            onClick={onManualEntry}
            className="w-full p-4 border-2 border-gray-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <PenTool className="w-6 h-6 text-gray-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">Manual Entry</h3>
              <p className="text-sm text-gray-600">Enter plant details manually</p>
            </div>
          </button>

          {onCheckHealth && (
            <button
              onClick={onCheckHealth}
              className="w-full p-4 border-2 border-gray-300 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-gray-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">Check Plant Health</h3>
                <p className="text-sm text-gray-600">Analyze any plant's health without adding it</p>
              </div>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

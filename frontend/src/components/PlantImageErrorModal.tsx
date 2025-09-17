import React from 'react';
import { X, AlertTriangle, Image, Camera } from 'lucide-react';

interface PlantImageErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

const PlantImageErrorModal: React.FC<PlantImageErrorModalProps> = ({
  isOpen,
  onClose,
  onRetry,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              Not a Plant Image
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">
              The uploaded image does not appear to contain a plant.
            </p>
            <p className="text-sm text-gray-500">
              Please upload an image of a plant, tree, flower, or other botanical subject.
            </p>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Tips for better results:
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Make sure the image shows a plant, tree, or flower</li>
              <li>• Avoid photos of animals, people, or objects</li>
              <li>• Ensure good lighting and clear focus</li>
              <li>• Include the entire plant in the frame</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantImageErrorModal;

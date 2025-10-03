import React, { useState } from 'react';
import { X, Gift } from 'lucide-react';

interface GiftPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message?: string) => void;
  plantName: string;
  plantImage?: string;
}

export function GiftPlantModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  plantName, 
  plantImage 
}: GiftPlantModalProps) {
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(message.trim() || undefined);
    setMessage('');
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Gift plant to a friend</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Plant Image */}
          <div className="mb-6">
            <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
              {plantImage ? (
                <img
                  src={plantImage}
                  alt={plantName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Gift className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Info Text */}
          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                The plant will be memorialized in your gifted site, accessible under the sites view
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                Share a link in next step so your friend can add it to their SproutSync account
              </p>
            </div>
          </div>

          {/* Optional Message */}
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Optional message (optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message for your friend..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/500 characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
          >
            Yes, gift plant
          </button>
        </div>
      </div>
    </div>
  );
}


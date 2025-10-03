import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

interface ShareGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantName: string;
  giftToken: string;
}

export function ShareGiftModal({ 
  isOpen, 
  onClose, 
  plantName, 
  giftToken 
}: ShareGiftModalProps) {
  const [copied, setCopied] = useState(false);
  
  // Use environment variable for base URL, fallback to window.location.origin for development
  // Set VITE_FRONTEND_BASE_URL in your environment variables for production
  const baseUrl = import.meta.env.VITE_FRONTEND_BASE_URL || window.location.origin;
  const giftUrl = `${baseUrl}/accept-gift/${giftToken}`;
  const shareText = `Here is my ${plantName} for you to care for in the SproutSync app. Follow the link to accept this gift: ${giftUrl}`;

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleCopyAndClose = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1000); // Close modal after 1 second to show "Copied!" feedback
    } catch (err) {
      console.error('Failed to copy text: ', err);
      onClose(); // Close modal even if copy fails
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Plant gifted</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <Share2 className="w-8 h-8 text-emerald-600" />
            </div>
          </div>

          {/* Info Text */}
          <div className="text-center mb-6">
            <p className="text-gray-700 mb-2">
              Send a link to your friend so that they can create a new account on SproutSync or use their existing account to continue caring for this plant
            </p>
          </div>

          {/* Share Link */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Share Link</label>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-600 break-all">
              {shareText}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleCopyAndClose}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            {copied ? 'Copied!' : 'Copy link and Close'}
          </button>
        </div>
      </div>
    </div>
  );
}


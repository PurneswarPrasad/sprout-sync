import React, { useState } from 'react';
import { X, Copy, Check, Link as LinkIcon } from 'lucide-react';

interface ShareGardenLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gardenUrl: string;
  username: string;
}

export function ShareGardenLinkDialog({
  isOpen,
  onClose,
  gardenUrl,
  username,
}: ShareGardenLinkDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(gardenUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Share Your Garden</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Share this link to show your garden to friends and the community!
          </p>

          {/* Garden Link Display */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">Your Garden Link</label>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-700 break-all">
              {gardenUrl}
            </div>
          </div>

          {/* Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-xs text-emerald-800">
              <span className="font-semibold">✨ Tip:</span> Your garden profile updates automatically when you add or remove plants!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              handleCopy();
              setTimeout(() => onClose(), 1000);
            }}
            className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
          >
            {copied ? 'Copied!' : 'Copy Link & Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
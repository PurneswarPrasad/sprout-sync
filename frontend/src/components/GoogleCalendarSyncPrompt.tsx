import React from 'react';
import { X, Calendar } from 'lucide-react';

interface GoogleCalendarSyncPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  plantName: string;
  isLoading?: boolean;
}

export const GoogleCalendarSyncPrompt: React.FC<GoogleCalendarSyncPromptProps> = ({
  isOpen,
  onClose,
  onConfirm,
  plantName,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Sync with Google Calendar?</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          Would you like to add <span className="font-semibold">{plantName}</span> to your Google Calendar sync? 
          This will automatically sync all tasks for this plant to your calendar.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Not now
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              'Yes, sync it'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


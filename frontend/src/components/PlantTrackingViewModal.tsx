import React from 'react';
import { X, Calendar, FileText, Camera, Heart, AlertTriangle } from 'lucide-react';
import { parseHealthNote } from '../utils/parseHealthNote';

interface PlantTrackingViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracking: {
    id: string;
    plantId: string;
    date: string;
    note: string;
    photoUrl?: string | null;
    cloudinaryPublicId?: string | null;
    createdAt: string;
  };
}

export const PlantTrackingViewModal: React.FC<PlantTrackingViewModalProps> = ({
  isOpen,
  onClose,
  tracking,
}) => {
  if (!isOpen) return null;

  const parsedNote = parseHealthNote(tracking.note);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div></div> {/* Empty div for spacing */}
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date
            </label>
            <div className="bg-gray-50 px-3 py-2 rounded-lg text-gray-600">
              {tracking.date}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-emerald-600" />
              <span>Health Analysis</span>
            </label>
            
            {parsedNote.hasIssue || parsedNote.isHealthy ? (
              <div className="bg-gray-50 rounded-lg p-4">
                {/* Health Status */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Health Status:</p>
                  {parsedNote.hasIssue ? (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-medium text-red-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Issue Detected: {parsedNote.issue || 'Unknown issue'}
                      </p>
                      {parsedNote.description && (
                        <p className="text-sm text-red-700 mt-2">{parsedNote.description}</p>
                      )}
                      {parsedNote.affected && (
                        <p className="text-sm text-red-700 mt-2">
                          <strong>Affected:</strong> {parsedNote.affected}
                        </p>
                      )}
                      {parsedNote.careSteps && (
                        <p className="text-sm text-red-700 mt-2">
                          <strong>Care Steps:</strong> {parsedNote.careSteps}
                        </p>
                      )}
                    </div>
                  ) : parsedNote.isHealthy ? (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="font-medium text-green-800">✅ Plant appears healthy!</p>
                      {parsedNote.description && (
                        <p className="text-sm text-green-700 mt-1">{parsedNote.description}</p>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Additional Notes */}
                {parsedNote.additionalNotes && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Additional Notes:</p>
                    <div className="bg-white px-3 py-2 rounded-lg text-gray-600 text-sm">
                      {parsedNote.additionalNotes}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 px-3 py-2 rounded-lg text-gray-600 max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                {tracking.note}
              </div>
            )}
          </div>

          {/* Photo */}
          {tracking.photoUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Camera className="w-4 h-4 inline mr-2" />
                Photo
              </label>
              <div className="bg-gray-50 p-3 rounded-lg">
                <img
                  src={tracking.photoUrl}
                  alt="Plant tracking photo"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

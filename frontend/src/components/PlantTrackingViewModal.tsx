import React from 'react';
import { X, Calendar, FileText, Camera } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div></div> {/* Empty div for spacing */}
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Note
            </label>
            <div className="bg-gray-50 px-3 py-2 rounded-lg text-gray-600 min-h-[100px] whitespace-pre-wrap">
              {tracking.note}
            </div>
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
  );
};

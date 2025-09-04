import React from 'react';
import { Calendar, FileText, Camera, Eye, Trash2 } from 'lucide-react';

interface PlantTrackingCardProps {
  tracking: {
    id: string;
    date: string;
    note: string;
    photoUrl?: string | null;
    createdAt: string;
  };
  onOpen?: (tracking: any) => void;
  onDelete?: (trackingId: string) => void;
}

export const PlantTrackingCard: React.FC<PlantTrackingCardProps> = ({ 
  tracking, 
  onOpen, 
  onDelete 
}) => {
  return (
    <div className="relative group bg-white rounded-lg p-4 border border-gray-200 shadow-sm overflow-hidden">
      {/* Main content */}
      <div className="transition-all duration-300 group-hover:blur-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{tracking.date}</span>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(tracking.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        <div className="mb-3">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-gray-800 leading-relaxed line-clamp-4 overflow-hidden">
              {tracking.note}
            </p>
          </div>
        </div>
        
        {tracking.photoUrl && (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Photo</span>
            </div>
            <img
              src={tracking.photoUrl}
              alt="Plant tracking photo"
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Hover overlay with action buttons */}
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex gap-3">
          <button
            onClick={() => onOpen?.(tracking)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Open
          </button>
          <button
            onClick={() => onDelete?.(tracking.id)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};


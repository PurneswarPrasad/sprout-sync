import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Upload, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { CloudinaryService } from '../services/cloudinaryService';

interface PlantTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantName: string;
  plantId: string; // Add plantId prop
  onSubmit: (data: PlantTrackingData) => void;
}

export interface PlantTrackingData {
  plantId: string; // Add plantId to the interface
  date: string;
  note: string;
  photoUrl?: string;
  cloudinaryPublicId?: string;
}

export const PlantTrackingModal: React.FC<PlantTrackingModalProps> = ({
  isOpen,
  onClose,
  plantName,
  plantId, // Add plantId parameter
  onSubmit,
}) => {
  const [date, setDate] = useState(format(new Date(), 'EEEE, MMM dd, yy'));
  const [note, setNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModalState = () => {
    setDate(format(new Date(), 'EEEE, MMM dd, yy'));
    setNote('');
    if (photoUrl) {
      CloudinaryService.revokePreviewUrl(photoUrl);
    }
    setPhotoUrl(null);
    setCloudinaryPublicId(null);
  };

  // Reset modal state when it opens
  useEffect(() => {
    if (isOpen) {
      resetModalState();
    }
  }, [isOpen]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload to Cloudinary service
      const result = await CloudinaryService.uploadImage(file);
      setPhotoUrl(result.secure_url);
      setCloudinaryPublicId(result.public_id);
      setIsUploading(false);
    } catch (error) {
      console.error('Error uploading photo:', error);
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!note.trim()) return;

    const trackingData: PlantTrackingData = {
      plantId, // Include the plantId
      date,
      note: note.trim(),
      ...(photoUrl && { photoUrl }),
      ...(cloudinaryPublicId && { cloudinaryPublicId }),
    };

    onSubmit(trackingData);
    resetModalState();
    onClose();
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Track {plantName}</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Plant Name (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plant Name
            </label>
            <div className="bg-gray-50 px-3 py-2 rounded-lg text-gray-600">
              {plantName}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Day, Month DD, YY"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-2" />
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="How is your plant doing today? Any observations or concerns?"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Camera className="w-4 h-4 inline mr-2" />
              Add Photo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                  <span className="ml-2 text-gray-600">Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Upload className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-600">Click to upload photo</span>
                </div>
              )}
            </button>
          </div>

          {/* Photo Preview */}
          {photoUrl && (
            <div className="relative">
              <img
                src={photoUrl}
                alt="Plant photo"
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                onClick={() => {
                  CloudinaryService.revokePreviewUrl(photoUrl);
                  setPhotoUrl(null);
                  setCloudinaryPublicId(null);
                }}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!note.trim()}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Update
          </button>
        </div>
      </div>
    </div>
  );
};

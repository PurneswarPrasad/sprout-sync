import React, { useState, useRef } from 'react';
import { X, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { plantsAPI } from '../services/api';
import { CloudinaryService } from '../services/cloudinaryService';

interface EditPlantModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantId: string;
  currentNickname: string | null;
  currentPhoto: {
    id: string;
    secureUrl: string;
    cloudinaryPublicId: string;
  } | null;
  onUpdate: () => void;
}

export function EditPlantModal({
  isOpen,
  onClose,
  plantId,
  currentNickname,
  currentPhoto,
  onUpdate,
}: EditPlantModalProps) {
  const [nickname, setNickname] = useState(currentNickname || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setNickname(currentNickname || '');
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsPhotoRemoved(false);
      setError('');
    }
  }, [isOpen, currentNickname, currentPhoto]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = CloudinaryService.getPreviewUrl(file);
      setPreviewUrl(url);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentPhoto) return;

    try {
      setIsUploading(true);
      setError('');
      
      // Immediately hide the photo from UI
      setIsPhotoRemoved(true);
      
      await plantsAPI.deletePhoto(plantId, currentPhoto.id);
      
      // Clean up local state
      setPreviewUrl(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh plant data and close modal
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error removing photo:', error);
      setError(error.response?.data?.error || 'Failed to remove photo');
      // Revert removal state on error
      setIsPhotoRemoved(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');

      // Update nickname
      await plantsAPI.update(plantId, { petName: nickname.trim() || null });

      // Handle photo updates
      if (selectedFile) {
        // Upload new photo
        setIsUploading(true);
        const uploadResult = await CloudinaryService.uploadImage(selectedFile);
        
        // Delete old photo if exists
        if (currentPhoto) {
          try {
            await plantsAPI.deletePhoto(plantId, currentPhoto.id);
          } catch (error) {
            console.error('Error deleting old photo:', error);
            // Continue even if deletion fails
          }
        }

        // Create new photo record
        await plantsAPI.createPhoto(plantId, {
          cloudinaryPublicId: uploadResult.public_id,
          secureUrl: uploadResult.optimized_url,
          takenAt: new Date().toISOString(),
        });

        // Clean up preview URL
        if (previewUrl) {
          CloudinaryService.revokePreviewUrl(previewUrl);
        }
      }

      // Refresh plant data
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating plant:', error);
      setError(error.response?.data?.error || 'Failed to update plant. Please try again.');
      
      // Clean up preview URL on error
      if (previewUrl) {
        CloudinaryService.revokePreviewUrl(previewUrl);
      }
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      CloudinaryService.revokePreviewUrl(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const displayPhoto = previewUrl || (currentPhoto && !selectedFile && !isPhotoRemoved ? currentPhoto.secureUrl : null);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Plant</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isSaving || isUploading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Nickname */}
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              Plant Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter plant nickname"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={isSaving || isUploading}
            />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plant Photo
            </label>
            <div className="space-y-4">
              {displayPhoto ? (
                <div className="relative">
                  <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={displayPhoto}
                      alt="Plant photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSaving || isUploading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      Change Photo
                    </button>
                    {currentPhoto && !selectedFile && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={isSaving || isUploading}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        disabled={isSaving || isUploading}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving || isUploading}
                    className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-emerald-500 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Upload Photo</span>
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isSaving || isUploading}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isSaving || isUploading}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving || isUploading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}


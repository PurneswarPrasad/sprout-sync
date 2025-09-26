import React, { useRef, useState } from 'react';
import { Upload, Camera, Trash2, X } from 'lucide-react';
import { CloudinaryService, CloudinaryUploadResult } from '../services/cloudinaryService';

interface ImageUploadSectionProps {
  imagePreview: string | null;
  isUploadingImage: boolean;
  isAutoPopulatingImage: boolean;
  isImageFromAI: boolean;
  aiTagMessage: string;
  onImageUpload: (file: File) => Promise<void>;
  onDeleteImage: () => Promise<void>;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onCapturePhoto: () => void;
  showCamera: boolean;
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  imagePreview,
  isUploadingImage,
  isAutoPopulatingImage,
  isImageFromAI,
  aiTagMessage,
  onImageUpload,
  onDeleteImage,
  onStartCamera,
  onStopCamera,
  onCapturePhoto,
  showCamera,
  stream,
  videoRef,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Plant Image
        </label>
        {isImageFromAI && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            {aiTagMessage}
          </span>
        )}
      </div>

      {!imagePreview ? (
        <div className="space-y-3">
          {/* Auto-populating indicator */}
          {isAutoPopulatingImage && (
            <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4 text-center bg-emerald-50">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-2"></div>
                <span className="text-sm text-emerald-700 font-medium">
                  Auto-populating image from AI identification...
                </span>
              </div>
            </div>
          )}

          {/* Upload from device */}
          <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center ${
            isAutoPopulatingImage ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              id="plant-image-upload"
              ref={fileInputRef}
              disabled={isUploadingImage}
            />
            <label
              htmlFor="plant-image-upload"
              className={`cursor-pointer flex flex-col items-center ${
                isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              {isUploadingImage ? (
                <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-2"></div>
              ) : (
                <Upload className="w-6 h-6 text-gray-400 mb-2" />
              )}
              <span className="text-sm text-gray-600">
                {isUploadingImage ? 'Uploading...' : 'Drag & drop or click to upload photo'}
              </span>
            </label>
          </div>

          {/* Take photo with camera */}
          <button
            type="button"
            onClick={onStartCamera}
            disabled={isUploadingImage || isAutoPopulatingImage}
            className={`w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors ${
              isUploadingImage || isAutoPopulatingImage ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Camera className="w-5 h-5" />
              <span>Take photo with camera</span>
            </div>
          </button>
        </div>
      ) : (
        /* Image preview */
        <div className="relative">
          <img
            src={imagePreview}
            alt="Plant preview"
            className="w-full h-auto max-h-48 object-contain rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={onDeleteImage}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Camera view */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Take Photo</h3>
              <button
                type="button"
                onClick={onStopCamera}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-gray-900 rounded-lg"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={onStopCamera}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onCapturePhoto}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

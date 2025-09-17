import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Loader2, Upload, Image } from 'lucide-react';
import { format } from 'date-fns';
import { CloudinaryService } from '../services/cloudinaryService';
import { api, aiAPI } from '../services/api';
import PlantImageErrorModal from './PlantImageErrorModal';

export interface PlantHealthData {
  plantId: string;
  plantName: string;
  date: string;
  note: string;
  photoUrl: string;
  originalPhotoUrl: string;
  cloudinaryPublicId: string;
}

interface PlantHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlantHealthData) => void;
  plantId: string;
  plantName: string;
}

const PlantHealthModal: React.FC<PlantHealthModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  plantId,
  plantName,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string>('');
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showPlantImageErrorModal, setShowPlantImageErrorModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentDate = format(new Date(), 'EEEE, MMM dd, yy');

  const resetModalState = async () => {
    // Clean up Cloudinary image if it was uploaded
    if (cloudinaryPublicId) {
      try {
        await CloudinaryService.deleteImage(cloudinaryPublicId);
        console.log('Deleted image from Cloudinary:', cloudinaryPublicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        // Continue with cleanup even if deletion fails
      }
    }
    
    setPhotoUrl('');
    setOriginalPhotoUrl('');
    setCloudinaryPublicId('');
    setNote('');
    setIsAnalyzing(false);
    setAnalysisError('');
    setCapturedImage(null);
    setActiveTab('camera');
    setShowPlantImageErrorModal(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetModalState();
    }
  }, [isOpen]);

  const handleClose = async () => {
    await resetModalState();
    onClose();
  };

  const handleDeleteImage = async () => {
    if (cloudinaryPublicId) {
      try {
        await CloudinaryService.deleteImage(cloudinaryPublicId);
        console.log('Deleted image from Cloudinary:', cloudinaryPublicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        // Continue with frontend cleanup even if Cloudinary deletion fails
      }
    }
    
    // Clean up frontend state
    setPhotoUrl('');
    setOriginalPhotoUrl('');
    setCloudinaryPublicId('');
    setNote(''); // Clear analysis note when image is deleted
    setCapturedImage(null);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setAnalysisError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type)) {
      setAnalysisError('Please upload a valid image file (JPG, PNG, WebP, HEIC)');
      return;
    }

    try {
      setAnalysisError('');
      setIsAnalyzing(true);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setCapturedImage(previewUrl);

      const result = await CloudinaryService.uploadImage(file);
      
      setPhotoUrl(result.optimized_url);
      setOriginalPhotoUrl(result.original_url);
      setCloudinaryPublicId(result.public_id);

      console.log('Uploaded image to Cloudinary:', result);

      // Automatically analyze the image after upload
      await analyzeImage(result.original_url);
    } catch (error) {
      console.error('Error uploading image:', error);
      setAnalysisError('Failed to upload image. Please try again.');
      setCapturedImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const analyzeImage = async (imageUrl: string) => {
    try {
      setIsAnalyzing(true);
      setAnalysisError('');

      const response = await aiAPI.analyzeHealthByUrl(imageUrl);

      if (response.data.success && response.data.data) {
        const analysis = response.data.data;
        
        // Format the analysis into a user-friendly note
        let analysisNote = '';
        
        if (analysis.disease?.issue) {
          analysisNote = `🔍 **Issue Detected: ${analysis.disease.issue}**\n\n`;
          analysisNote += `**Description:** ${analysis.disease.description}\n\n`;
          analysisNote += `**Affected Plants:** ${analysis.disease.affected}\n\n`;
          analysisNote += `**Care Steps:** ${analysis.disease.steps}`;
        } else {
          analysisNote = `✅ **Plant appears healthy!**\n\n`;
          analysisNote += `No significant issues detected. Continue with regular care routine.`;
        }

        setNote(analysisNote);
      } else {
        setAnalysisError('Failed to analyze image. Please try again.');
      }
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      const errorMessage = error.response?.data?.error || 'Failed to analyze image. Please try again.';
      
      // Check if it's a plant image validation error
      if (errorMessage.includes('does not appear to contain a plant')) {
        setShowPlantImageErrorModal(true);
        setAnalysisError(''); // Clear the regular error since we're showing the modal
      } else {
        setAnalysisError(errorMessage);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!photoUrl || !note.trim()) {
      setAnalysisError('Please upload a photo and ensure analysis is complete');
      return;
    }

    const healthData: PlantHealthData = {
      plantId,
      plantName,
      date: currentDate,
      note: note.trim(),
      photoUrl,
      originalPhotoUrl,
      cloudinaryPublicId,
    };

    onSubmit(healthData);
    // Don't delete the image on successful submit - it's being used
    setPhotoUrl('');
    setOriginalPhotoUrl('');
    setCloudinaryPublicId('');
    setNote('');
    setIsAnalyzing(false);
    setAnalysisError('');
    setCapturedImage(null);
    onClose();
  };

  const handleClosePlantImageErrorModal = async () => {
    setShowPlantImageErrorModal(false);
    // Clean up the uploaded image and reset state
    await handleDeleteImage();
  };

  const handleRetryPlantImage = async () => {
    setShowPlantImageErrorModal(false);
    // Clean up the uploaded image and reset state
    await handleDeleteImage();
  };

  // Handle back button and escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    const handlePopState = () => {
      if (isOpen) {
        handleClose();
        // Push a new state to prevent going back
        window.history.pushState(null, '', window.location.href);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      window.addEventListener('popstate', handlePopState);
      // Push a new state when modal opens
      window.history.pushState(null, '', window.location.href);
      
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate pr-2" title={`Monitor ${plantName}'s Health`}>
            Monitor {plantName}'s Health
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Plant Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plant Name
              </label>
              <input
                type="text"
                value={plantName}
                disabled
                className="w-full bg-gray-50 px-3 py-2 rounded-lg text-gray-600 cursor-not-allowed truncate"
                title={plantName}
              />
            </div>

            {/* Current Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="text"
                value={currentDate}
                disabled
                className="w-full bg-gray-50 px-3 py-2 rounded-lg text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* Photo Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Photo
              </label>
              
              {!capturedImage ? (
                <div className="space-y-4">
                  {/* Tab Navigation */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab('camera')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'camera'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Camera className="w-4 h-4" />
                        Take Photo
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'upload'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload
                      </div>
                    </button>
                  </div>

                  {/* Camera Tab */}
                  {activeTab === 'camera' && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="bg-gray-100 rounded-xl p-8 mb-4">
                          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">
                            Take a photo of your plant to analyze its health
                          </p>
                          <button
                            onClick={handleTakePhoto}
                            disabled={isAnalyzing}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isAnalyzing ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                              </div>
                            ) : (
                              'Take Photo'
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Hidden file input for camera capture */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  )}

                  {/* Upload Tab */}
                  {activeTab === 'upload' && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="bg-gray-100 rounded-xl p-8 mb-4">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">
                            Upload a photo from your device
                          </p>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isAnalyzing}
                            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isAnalyzing ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                              </div>
                            ) : (
                              'Choose File'
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Hidden file input for upload */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* Image Preview */
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={capturedImage}
                      alt="Captured plant photo"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={handleDeleteImage}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {isAnalyzing && (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Analyzing plant health...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Analysis Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Analysis Result
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Analysis will appear here after photo upload..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto"
                rows={4}
                disabled={isAnalyzing}
                style={{ maxHeight: '200px' }}
              />
            </div>

            {/* Error Message */}
            {analysisError && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {analysisError}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!photoUrl || !note.trim() || isAnalyzing}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit Health Update
            </button>
          </div>
        </div>
      </div>

      {/* Plant Image Error Modal */}
      <PlantImageErrorModal
        isOpen={showPlantImageErrorModal}
        onClose={handleClosePlantImageErrorModal}
        onRetry={handleRetryPlantImage}
      />
    </div>
  );
};

export default PlantHealthModal;
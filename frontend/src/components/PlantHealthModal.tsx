import React, { useState, useEffect } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { CloudinaryService } from '../services/cloudinaryService';
import { api, aiAPI } from '../services/api';

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
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

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
    setShowCamera(false);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetModalState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (showCamera && stream && videoRef) {
      videoRef.srcObject = stream;
    }
  }, [showCamera, stream, videoRef]);

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
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      setAnalysisError('');
    } catch (error) {
      console.error('Error accessing camera:', error);
      setAnalysisError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = async () => {
    if (!videoRef || !stream) return;

    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) return;

      canvas.width = videoRef.videoWidth;
      canvas.height = videoRef.videoHeight;
      
      context.drawImage(videoRef, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        // Convert blob to file
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        
        try {
          setAnalysisError('');
          setIsAnalyzing(true);

          const result = await CloudinaryService.uploadImage(file);
          
          setPhotoUrl(result.optimized_url);
          setOriginalPhotoUrl(result.original_url);
          setCloudinaryPublicId(result.public_id);

          console.log('Uploaded camera capture to Cloudinary:', result);

          // Stop camera and hide it
          stopCamera();

          // Automatically analyze the image after upload
          await analyzeImage(result.original_url);
        } catch (error) {
          console.error('Error uploading camera capture:', error);
          setAnalysisError('Failed to upload photo. Please try again.');
        } finally {
          setIsAnalyzing(false);
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      console.error('Error capturing photo:', error);
      setAnalysisError('Failed to capture photo. Please try again.');
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
    } catch (error) {
      console.error('Error analyzing image:', error);
      setAnalysisError('Failed to analyze image. Please try again.');
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
    setShowCamera(false);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Monitor {plantName}'s Health
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
                className="w-full bg-gray-50 px-3 py-2 rounded-lg text-gray-600 cursor-not-allowed"
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

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Photo
              </label>
              
              {!showCamera && !photoUrl ? (
                <div className="space-y-3">
                  {/* Upload from device */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="health-photo-upload"
                      disabled={isAnalyzing}
                    />
                    <label
                      htmlFor="health-photo-upload"
                      className={`cursor-pointer flex flex-col items-center ${
                        isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                      }`}
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                      ) : (
                        <Camera className="w-6 h-6 text-gray-400 mb-2" />
                      )}
                      <span className="text-sm text-gray-600">
                        {isAnalyzing ? 'Analyzing...' : 'Upload from device'}
                      </span>
                    </label>
                  </div>
                  
                  {/* Take photo with camera */}
                  <button
                    onClick={startCamera}
                    disabled={isAnalyzing}
                    className={`w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors ${
                      isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Camera className="w-5 h-5" />
                      <span>Take photo with camera</span>
                    </div>
                  </button>
                </div>
              ) : showCamera ? (
                /* Camera view */
                <div className="space-y-3">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={setVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white bg-opacity-20 rounded-full p-2">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={stopCamera}
                      className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={capturePhoto}
                      disabled={isAnalyzing}
                      className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isAnalyzing ? 'Processing...' : 'Capture Photo'}
                    </button>
                  </div>
                </div>
              ) : null}
              
              {photoUrl && (
                <div className="mt-3 relative">
                  <img
                    src={photoUrl}
                    alt="Uploaded plant photo"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={handleDeleteImage}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
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
    </div>
  );
};

export default PlantHealthModal;

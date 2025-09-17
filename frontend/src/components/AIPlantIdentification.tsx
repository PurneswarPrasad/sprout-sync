import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, Loader2, AlertCircle, Image } from 'lucide-react';
import { aiAPI } from '../services/api';
import { TipsModal } from './TipsModal';
import PlantImageErrorModal from './PlantImageErrorModal';

interface AIPlantIdentificationProps {
  onBack: () => void;
  onIdentificationComplete: (data: any) => void;
}

interface AIIdentificationResult {
  botanicalName: string;
  commonName: string;
  plantType: string;
  confidence: number;
  care: {
    watering: string;
    fertilizing: string;
    pruning: string;
    spraying: string;
    sunlightRotation: string;
  };
  suggestedTasks: Array<{
    name: string;
    frequencyDays: number;
  }>;
}

export const AIPlantIdentification: React.FC<AIPlantIdentificationProps> = ({
  onBack,
  onIdentificationComplete,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'camera' | 'url'>('camera');
  const [imageUrl, setImageUrl] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tips modal state
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  // Plant image error modal state
  const [showPlantImageErrorModal, setShowPlantImageErrorModal] = useState(false);
  
  // Create refs for the hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Cleanup function to revoke any temporary image URLs
  const cleanupTemporaryImages = () => {
    if (capturedImage && capturedImage.startsWith('blob:')) {
      URL.revokeObjectURL(capturedImage);
    }
  };

  // Cleanup on component unmount
  React.useEffect(() => {
    return () => {
      cleanupTemporaryImages();
    };
  }, [capturedImage]);

  const handleTakePhotoClick = () => {
    setShowTipsModal(true);
    setCurrentTipIndex(0);
  };

  const handleNextTip = () => {
    if (currentTipIndex < 2) { // 3 tips total (0, 1, 2)
      setCurrentTipIndex(currentTipIndex + 1);
    } else {
      // Last tip - open camera
      setShowTipsModal(false);
      cameraInputRef.current?.click();
    }
  };

  const handleCloseTips = () => {
    setShowTipsModal(false);
    setCurrentTipIndex(0);
  };

  const handleClosePlantImageErrorModal = () => {
    setShowPlantImageErrorModal(false);
    // Clear the captured image and reset state
    setCapturedImage(null);
    setImageUrl('');
    setError(null);
  };

  const handleRetryPlantImage = () => {
    setShowPlantImageErrorModal(false);
    // Clear the captured image and reset state
    setCapturedImage(null);
    setImageUrl('');
    setError(null);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const identifyPlant = async (imageData: string) => {
    setLoading(true);
    setError(null);
  
    try {
      let response;
      let imageInfo: { type: 'camera' | 'url' | 'file'; data: string; file?: File } | null = null;
      
      if (imageData.startsWith('data:image/')) {
        // Camera capture or file upload - convert base64 to file and upload
        const formData = new FormData();
        
        // Convert base64 data URL to blob
        const base64Response = await fetch(imageData);
        const blob = await base64Response.blob();
        
        // Create file from blob
        const file = new File([blob], 'plant-image.jpg', { type: 'image/jpeg' });
        formData.append('image', file);
        
        // Store image info for auto-population
        imageInfo = {
          type: 'file',
          data: imageData,
          file: file
        };
        
        // Use file upload endpoint
        response = await aiAPI.identifyFile(formData);
      } else {
        // Image URL - use URL endpoint
        imageInfo = {
          type: 'url',
          data: imageData
        };
        
        response = await aiAPI.identifyByUrl(imageData);
      }
  
      if (response.data.success) {
        // Include image info in the response for auto-population
        const aiDataWithImage = {
          ...response.data.data,
          imageInfo: imageInfo
        };
        onIdentificationComplete(aiDataWithImage);
      } else {
        setError('Failed to identify plant. Please try again.');
      }
    } catch (error: any) {
      console.error('AI identification error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to identify plant. Please try again.';
      
      // Check if it's a plant image validation error
      if (errorMessage.includes('does not appear to contain a plant')) {
        setShowPlantImageErrorModal(true);
        setError(null); // Clear the regular error since we're showing the modal
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      return;
    }
    await identifyPlant(imageUrl);
  };

  const handleCaptureSubmit = async () => {
    if (!capturedImage) {
      setError('Please capture or upload an image first');
      return;
    }
    await identifyPlant(capturedImage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => {
              cleanupTemporaryImages();
              onBack();
            }}
            className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">AI Plant Identification</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'camera'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Camera
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'url'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Image URL
            </button>
          </div>

          {/* Camera Tab */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {!capturedImage ? (
                <div className="space-y-6">
                  {/* Take Photo Section */}
                  <div className="text-center">
                    <div className="bg-gray-100 rounded-xl p-8 mb-4">
                      <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-6">Take a photo of your plant</p>
                      
                      {/* Hidden file input for camera */}
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file);
                          }
                        }}
                        className="hidden"
                      />
                      
                      {/* Custom styled button for camera */}
                      <button
                        onClick={handleTakePhotoClick}
                        className="w-full py-3 px-6 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
                      >
                        Take Photo
                      </button>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        This will show tips before opening your camera
                      </p>
                    </div>
                  </div>
                  
                  {/* Upload from Gallery Section */}
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Or upload from your gallery:</p>
                    
                    {/* Hidden file input for gallery */}
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file);
                        }
                      }}
                      className="hidden"
                    />
                    
                    {/* Custom styled button for gallery */}
                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      className="w-full py-2 px-4 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Choose Photo
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      Choose an existing photo from your device
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={capturedImage}
                      alt="Captured plant"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setCapturedImage(null);
                        setError(null);
                      }}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Retake
                    </button>
                    <button
                      onClick={handleCaptureSubmit}
                      disabled={loading}
                      className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze Plant'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* URL Tab */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/plant-image.jpg"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use direct image URLs (ending in .jpg, .png, etc.) - not search engine pages
                </p>
              </div>
              <button
                onClick={handleUrlSubmit}
                disabled={loading || !imageUrl.trim()}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Plant'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-800 mb-2">Tips for better identification:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Ensure good lighting and clear focus</li>
            <li>• Include the entire plant in the frame</li>
            <li>• Avoid shadows and reflections</li>
            <li>• Use high-quality images for best results</li>
          </ul>
        </div>
      </div>

      {/* Tips Modal */}
      <TipsModal
        isOpen={showTipsModal}
        currentTipIndex={currentTipIndex}
        onNext={handleNextTip}
        onClose={handleCloseTips}
      />

      {/* Plant Image Error Modal */}
      <PlantImageErrorModal
        isOpen={showPlantImageErrorModal}
        onClose={handleClosePlantImageErrorModal}
        onRetry={handleRetryPlantImage}
      />
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, AlertCircle, Image } from 'lucide-react';
import { aiAPI } from '../services/api';
import { CameraTab } from './CameraTab';
import { UrlTab } from './UrlTab';
import PlantImageErrorModal from './PlantImageErrorModal';
import { TutorialSpotlight } from './TutorialSpotlight';
import { shouldShowTutorial, isStepDismissed, markStepCompleted, markStepSkipped } from '../utils/tutorial';

interface AIPlantIdentificationProps {
  onBack: () => void;
  onIdentificationComplete: (data: any) => void;
}

interface AIIdentificationResult {
  botanicalName: string;
  commonName: string;
  plantType: string;
  confidence: number;
  careLevel?: string;
  sunRequirements?: string;
  toxicityLevel?: string;
  petFriendliness?: {
    isFriendly: boolean;
    reason: string;
  };
  commonPestsAndDiseases?: string;
  preventiveMeasures?: string;
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
  
  // Plant image error modal state
  const [showPlantImageErrorModal, setShowPlantImageErrorModal] = useState(false);

  // Tutorial refs and state
  const cameraAreaRef = useRef<HTMLDivElement>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (shouldShowTutorial() && !isStepDismissed('ai-camera-area')) {
      // Delay to let the page render first
      setTimeout(() => {
        setShowTutorial(true);
      }, 300);
    }
  }, []);

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

  const handleImageCapture = (imageData: string) => {
    setCapturedImage(imageData);
    setError(null);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
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

  // Tutorial handlers
  const handleSkipTutorial = () => {
    markStepSkipped('ai-camera-area');
    setShowTutorial(false);
  };

  const handleNextTutorial = () => {
    markStepCompleted('ai-camera-area');
    setShowTutorial(false);
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
        <div ref={cameraAreaRef} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm mb-6">
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
            <CameraTab
              capturedImage={capturedImage}
              loading={loading}
              onImageCapture={handleImageCapture}
              onAnalyze={handleCaptureSubmit}
              onRetake={handleRetake}
              onError={setError}
            />
          )}

          {/* URL Tab */}
          {activeTab === 'url' && (
            <UrlTab
              imageUrl={imageUrl}
              loading={loading}
              onUrlChange={setImageUrl}
              onAnalyze={handleUrlSubmit}
            />
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Instructions - Only show for camera tab */}
        {activeTab === 'camera' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-medium text-blue-800 mb-2">Tips for better identification:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ensure good lighting and clear focus</li>
              <li>• Include the entire plant in the frame</li>
              <li>• Avoid shadows and reflections</li>
              <li>• Use high-quality images for best results</li>
            </ul>
          </div>
        )}
      </div>


      {/* Plant Image Error Modal */}
      <PlantImageErrorModal
        isOpen={showPlantImageErrorModal}
        onClose={handleClosePlantImageErrorModal}
        onRetry={handleRetryPlantImage}
      />

      {/* Tutorial Spotlight */}
      <TutorialSpotlight
        isVisible={showTutorial}
        targetRef={cameraAreaRef}
        message="Your camera does the magic here!"
        position="right"
        onSkip={handleSkipTutorial}
        onNext={handleNextTutorial}
      />
    </div>
  );
};
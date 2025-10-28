import React, { useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { TipsModal } from './TipsModal';
import ScannerAnimation from './animations/ScannerAnimation';

interface CameraTabProps {
  capturedImage: string | null;
  loading: boolean;
  onImageCapture: (imageData: string) => void;
  onAnalyze: () => void;
  onRetake: () => void;
  onError: (error: string) => void;
}

const TIPS_SEEN_KEY = 'ai-plant-tips-seen';

export const CameraTab: React.FC<CameraTabProps> = ({
  capturedImage,
  loading,
  onImageCapture,
  onAnalyze,
  onRetake,
  onError,
}) => {
  const [showTipsModal, setShowTipsModal] = React.useState(false);
  const [currentTipIndex, setCurrentTipIndex] = React.useState(0);
  
  // Create refs for the hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleTakePhotoClick = () => {
    const hasSeenTips = localStorage.getItem(TIPS_SEEN_KEY) === 'true';
    
    if (hasSeenTips) {
      // User has already seen the tips, open camera directly
      cameraInputRef.current?.click();
    } else {
      // First time viewing, show tips
      setShowTipsModal(true);
      setCurrentTipIndex(0);
    }
  };

  const handleNextTip = () => {
    if (currentTipIndex < 2) { // 3 tips total (0, 1, 2)
      setCurrentTipIndex(currentTipIndex + 1);
    } else {
      // Last tip - mark as seen and open camera
      localStorage.setItem(TIPS_SEEN_KEY, 'true');
      setShowTipsModal(false);
      cameraInputRef.current?.click();
    }
  };

  const handleCloseTips = () => {
    // Mark tips as seen so they don't show again
    localStorage.setItem(TIPS_SEEN_KEY, 'true');
    setShowTipsModal(false);
    setCurrentTipIndex(0);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      onImageCapture(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
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
              {/* Scanner animation overlay when analyzing */}
              <ScannerAnimation show={loading} />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onRetake}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Retake
              </button>
              <button
                onClick={onAnalyze}
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

      {/* Tips Modal */}
      <TipsModal
        isOpen={showTipsModal}
        currentTipIndex={currentTipIndex}
        onNext={handleNextTip}
        onClose={handleCloseTips}
      />
    </>
  );
};

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, Loader2 } from 'lucide-react';
import { aiAPI } from '../services/api';

interface AIPlantIdentificationProps {
  onBack: () => void;
  onIdentificationComplete: (data: any) => void;
}

interface AIIdentificationResult {
  speciesGuess: string;
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  };

  const identifyPlant = async (imageData: string) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('imageUrl', imageData);
      const response = await aiAPI.identify(formData);

      if (response.data.success) {
        onIdentificationComplete(response.data.data);
      } else {
        setError('Failed to identify plant. Please try again.');
      }
    } catch (error: any) {
      console.error('AI identification error:', error);
      setError(error.response?.data?.error || 'Failed to identify plant. Please try again.');
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
      setError('Please capture an image first');
      return;
    }
    await identifyPlant(capturedImage);
  };

  React.useEffect(() => {
    if (activeTab === 'camera' && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
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
                <div className="space-y-4">
                  <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Camera className="w-12 h-12 mx-auto mb-2" />
                        <p>Position your plant in the camera view</p>
                      </div>
                    </div>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <button
                    onClick={captureImage}
                    className="w-full py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                  >
                    Capture Photo
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video">
                    <img
                      src={capturedImage}
                      alt="Captured plant"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={retakePhoto}
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
    </div>
  );
};

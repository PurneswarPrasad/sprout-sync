import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { plantsAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { ArrowLeft, Plus, Check, X, Upload, Camera, Trash2 } from 'lucide-react';
import { ConfidenceNotification } from '../components/ConfidenceNotification';
import { CityAutocomplete } from '../components/CityAutocomplete';
import { CloudinaryService, CloudinaryUploadResult } from '../services/cloudinaryService';

// Helper function to get today's date in YYYY-MM-DD format in local timezone
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get today's date with 00:00 time for daily tasks
const getTodayWithMidnightTime = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  // Construct ISO string manually to avoid timezone conversion
  return `${year}-${month}-${day}T00:00:00.000Z`;
};

// Helper function to convert date string to ISO string WITHOUT timezone conversion
const convertDateStringToLocalISO = (dateString: string) => {
  // Parse the date string components
  const [year, month, day] = dateString.split('-').map(Number);

  // Construct ISO string manually to avoid timezone conversion issues
  // This ensures the date remains as intended regardless of local timezone
  const paddedMonth = String(month).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');

  return `${year}-${paddedMonth}-${paddedDay}T00:00:00.000Z`;
};

// Helper function to get task icon based on task key
const getTaskIcon = (taskKey: string): string => {
  const iconMap: { [key: string]: string } = {
    watering: '💧',
    fertilizing: '🌱',
    pruning: '✂️',
    spraying: '💨',
    sunlightRotation: '☀️',
  };
  return iconMap[taskKey] || '🌿';
};

interface TaskTemplate {
  id: string;
  key: string;
  label: string;
  colorHex: string;
  defaultFrequencyDays: number;
}

interface SelectedTask {
  key: string;
  label: string;
  colorHex: string;
  frequency: number;
  lastCompleted?: string;
}

export const AddPlantPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [taskTemplatesLoading, setTaskTemplatesLoading] = useState(true);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    petName: '',
    botanicalName: '',
    commonName: '',
    type: '',
    acquisitionDate: '',
    city: '',
  });


  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploadResult, setImageUploadResult] = useState<CloudinaryUploadResult | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiProcessedRef = useRef(false);

  // AI identification state
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [showConfidenceNotification, setShowConfidenceNotification] = useState(false);
  const [isImageFromAI, setIsImageFromAI] = useState(false);
  const [isAutoPopulatingImage, setIsAutoPopulatingImage] = useState(false);
  const [aiData, setAiData] = useState<any>(null);
  const [hasProcessedAI, setHasProcessedAI] = useState(false);

  // Helper function to generate AI tag message
  const getAITagMessage = () => {
    if (!aiData?.commonName || aiData.commonName.trim() === '') {
      return "✨ Looks like you found a plant buddy!";
    }
    
    // Get the first common name if multiple are provided (comma-separated)
    const firstCommonName = aiData.commonName.split(',')[0].trim();
    
    // If the first common name is empty after trimming, fall back to default
    if (firstCommonName === '') {
      return "✨ Looks like you found a plant buddy!";
    }
    
    return `✨ Looks like you found a ${firstCommonName}!`;
  };

  // Fetch task templates on component mount
  useEffect(() => {
    fetchTaskTemplates();
  }, []);

  // Handle AI data from navigation state
  useEffect(() => {
    if (location.state?.aiData && location.state?.fromAI && !aiProcessedRef.current) {
      console.log('Processing AI identification data for the first time');
      aiProcessedRef.current = true;
      setHasProcessedAI(true);
      handleAIIdentification(location.state.aiData);
      // Clear the state to prevent re-processing
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.aiData, location.state?.fromAI]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (imagePreview) {
        CloudinaryService.revokePreviewUrl(imagePreview);
      }
    };
  }, [stream, imagePreview]);

  const fetchTaskTemplates = async () => {
    setTaskTemplatesLoading(true);
    try {
      const response = await plantsAPI.getTaskTemplates();
      setTaskTemplates(response.data.data);
    } catch (error) {
      console.error('Error fetching task templates:', error);
      // Fallback to default task templates if API fails
      const defaultTemplates: TaskTemplate[] = [
        {
          id: '1',
          key: 'watering',
          label: 'Watering',
          colorHex: '#3B82F6',
          defaultFrequencyDays: 3,
        },
        {
          id: '2',
          key: 'fertilizing',
          label: 'Fertilizing',
          colorHex: '#10B981',
          defaultFrequencyDays: 14,
        },
        {
          id: '3',
          key: 'pruning',
          label: 'Pruning',
          colorHex: '#F59E0B',
          defaultFrequencyDays: 30,
        },
        {
          id: '4',
          key: 'spraying',
          label: 'Spraying',
          colorHex: '#8B5CF6',
          defaultFrequencyDays: 7,
        },
        {
          id: '5',
          key: 'sunlightRotation',
          label: 'Sunlight Rotation',
          colorHex: '#F97316',
          defaultFrequencyDays: 14,
        },
      ];
      setTaskTemplates(defaultTemplates);
    } finally {
      setTaskTemplatesLoading(false);
    }
  };

  const toggleTaskSelection = (template: TaskTemplate) => {
    const isSelected = selectedTasks.some(task => task.key === template.key);

    if (isSelected) {
      setSelectedTasks(selectedTasks.filter(task => task.key !== template.key));
    } else {
      const newTask: SelectedTask = {
        key: template.key,
        label: template.label,
        colorHex: template.colorHex,
        frequency: template.defaultFrequencyDays,
        ...(template.defaultFrequencyDays === 1 && { lastCompleted: getTodayDateString() })
      };

      setSelectedTasks([...selectedTasks, newTask]);
    }
  };

  const updateTaskFrequency = (taskKey: string, frequency: number) => {
    setSelectedTasks(selectedTasks.map(task => {
      if (task.key === taskKey) {
        // If frequency is set to 1, automatically set lastCompleted to today
        if (frequency === 1) {
          return { ...task, frequency, lastCompleted: getTodayDateString() };
        }
        // If frequency was 1 and is now changed to something else, clear lastCompleted
        else if (task.frequency === 1) {
          return { ...task, frequency, lastCompleted: undefined };
        }
        // Otherwise, just update frequency
        return { ...task, frequency };
      }
      return task;
    }));
  };

  const updateTaskLastCompleted = (taskKey: string, lastCompleted: string) => {
    setSelectedTasks(selectedTasks.map(task =>
      task.key === taskKey ? { ...task, lastCompleted } : task
    ));
  };

  const removeTask = (taskKey: string) => {
    setSelectedTasks(selectedTasks.filter(task => task.key !== taskKey));
  };

  // Image handling functions
  const handleImageUpload = async (file: File) => {
    try {
      setIsUploadingImage(true);

      console.log('Manual upload: Uploading image to Cloudinary', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const result = await CloudinaryService.uploadImage(file);
      console.log('Manual upload: Upload successful', {
        publicId: result.public_id,
        optimizedUrl: result.optimized_url
      });

      setImageUploadResult(result);
      setImageFile(file);

      // Create preview URL
      const previewUrl = CloudinaryService.getPreviewUrl(file);
      setImagePreview(previewUrl);

      // Reset AI flag when user manually uploads
      setIsImageFromAI(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setShowCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please try uploading a file instead.');
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
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        await handleImageUpload(file);
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  };

  const deleteImage = async () => {
    if (imageUploadResult) {
      try {
        await CloudinaryService.deleteImage(imageUploadResult.public_id);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    if (imagePreview) {
      CloudinaryService.revokePreviewUrl(imagePreview);
    }

    setImageFile(null);
    setImagePreview(null);
    setImageUploadResult(null);
    setIsImageFromAI(false);
    setAiData(null); // Clear AI data when image is deleted
  };

  // Function to handle AI identification data
  const handleAIIdentification = async (aiData: any) => {
    console.log('handleAIIdentification: Processing AI data', { 
      hasImageInfo: !!aiData.imageInfo,
      botanicalName: aiData.botanicalName,
      commonName: aiData.commonName,
      plantType: aiData.plantType
    });

    // Prevent multiple executions
    if (aiProcessedRef.current && hasProcessedAI) {
      console.log('handleAIIdentification: Already processed, skipping');
      return;
    }

    // Store AI data for later use (e.g., for the tag message)
    setAiData(aiData);

    // Set plant names and type from AI identification
    setFormData(prev => ({
      ...prev,
      botanicalName: aiData.botanicalName || '',
      commonName: aiData.commonName || '',
      type: aiData.plantType || '',
    }));

    // Convert AI suggested tasks to selected tasks
    const aiTasks: SelectedTask[] = aiData.suggestedTasks.map((task: any) => {
      const template = taskTemplates.find(t => t.key === task.name);
      return {
        key: task.name,
        label: template?.label || task.name,
        colorHex: template?.colorHex || '#3B82F6',
        frequency: task.frequencyDays,
        ...(task.frequencyDays === 1 && { lastCompleted: getTodayDateString() })
      };
    });

    setSelectedTasks(aiTasks);

    // Auto-populate image if available
    if (aiData.imageInfo) {
      console.log('AI Auto-population: Image info', aiData.imageInfo);
      await handleAIImageAutoPopulation(aiData.imageInfo);
    }

    // Show confidence notification
    setAiConfidence(aiData.confidence);
    setShowConfidenceNotification(true);
  };

  // Function to handle AI image auto-population
  // Function to handle AI image auto-population
  const handleAIImageAutoPopulation = async (imageInfo: { type: 'camera' | 'url' | 'file'; data: string; file?: File }) => {
    // Prevent multiple executions
    if (isAutoPopulatingImage) {
      console.log('AI Auto-population: Already in progress, skipping');
      return;
    }

    setIsAutoPopulatingImage(true);

    try {
      console.log('AI Auto-population: Starting image auto-population');

      if ((imageInfo.type === 'camera' || imageInfo.type === 'file') && imageInfo.file) {
        // For camera capture or file upload, upload directly to Cloudinary
        console.log('AI Auto-population: Uploading image to Cloudinary', {
          fileName: imageInfo.file.name,
          fileSize: imageInfo.file.size,
          fileType: imageInfo.file.type
        });

        const result = await CloudinaryService.uploadImage(imageInfo.file);
        console.log('AI Auto-population: Upload successful', {
          publicId: result.public_id,
          optimizedUrl: result.optimized_url
        });

        setImageUploadResult(result);
        setImageFile(imageInfo.file);

        // Create preview URL
        const previewUrl = CloudinaryService.getPreviewUrl(imageInfo.file);
        setImagePreview(previewUrl);

        setIsImageFromAI(true);
      } else if (imageInfo.type === 'url') {
        // For URL, we need to fetch the image and upload it to Cloudinary
        await handleURLImageAutoPopulation(imageInfo.data);
        setIsImageFromAI(true);
      }
    } catch (error) {
      console.error('Error auto-populating image from AI identification:', error);
      // Don't show error to user as this is a convenience feature
    } finally {
      setIsAutoPopulatingImage(false);
    }
  };

  // Function to handle URL image auto-population
  const handleURLImageAutoPopulation = async (imageUrl: string) => {
    try {
      setIsUploadingImage(true);

      console.log('AI Auto-population: Fetching image from URL', { imageUrl });

      // Fetch the image from URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image from URL');
      }

      const blob = await response.blob();
      const file = new File([blob], 'ai-identified-image.jpg', { type: blob.type || 'image/jpeg' });

      console.log('AI Auto-population: Uploading URL image to Cloudinary', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Upload to Cloudinary
      const result = await CloudinaryService.uploadImage(file);
      console.log('AI Auto-population: URL upload successful', {
        publicId: result.public_id,
        optimizedUrl: result.optimized_url
      });

      setImageUploadResult(result);
      setImageFile(file);

      // Create preview URL
      const previewUrl = CloudinaryService.getPreviewUrl(file);
      setImagePreview(previewUrl);

    } catch (error) {
      console.error('Error auto-populating URL image:', error);
      // Don't show error to user as this is a convenience feature
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.botanicalName.trim()) {
      alert('Botanical name is required');
      return;
    }
    if (!formData.commonName.trim()) {
      alert('Common name is required');
      return;
    }

    setLoading(true);

    try {
      // Prepare care tasks object
      const careTasks: any = {};
      const today = getTodayDateString(); // Get today's date in YYYY-MM-DD format

      selectedTasks.forEach(task => {
        const taskData: any = { frequency: task.frequency };

        // If frequency is 1, automatically set last completed to today at 00:00
        if (task.frequency === 1) {
          const lastCompletedKey = `last${task.key.charAt(0).toUpperCase() + task.key.slice(1)}`;
          taskData[lastCompletedKey] = getTodayWithMidnightTime();
        }
        // Otherwise, use the manually provided last completed date if available
        else if (task.lastCompleted) {
          const lastCompletedKey = `last${task.key.charAt(0).toUpperCase() + task.key.slice(1)}`;
          // Convert date string to ISO string in local timezone to avoid timezone shifts
          taskData[lastCompletedKey] = convertDateStringToLocalISO(task.lastCompleted);
        }

        console.log('taskData', taskData);

        careTasks[task.key] = taskData;

        console.log('careTasks', careTasks);
      });

      const plantData = {
        ...formData,
        careTasks: Object.keys(careTasks).length > 0 ? careTasks : undefined,
      };

      console.log('plantData', plantData);

      const response = await plantsAPI.create(plantData);

      console.log('Plant created successfully:', response.data);

      // If there's an uploaded image, create a photo record
      if (imageUploadResult && response.data.data?.id) {
        try {
          await plantsAPI.createPhoto(response.data.data.id, {
            cloudinaryPublicId: imageUploadResult.public_id,
            secureUrl: imageUploadResult.optimized_url,
            takenAt: new Date().toISOString(),
          });
          console.log('Photo created successfully');
        } catch (photoError) {
          console.error('Error creating photo record:', photoError);
          // Don't block navigation if photo creation fails
        }
      }

      navigate(`/plants/${response.data.data.id}`, { state: { plantCreated: true } });
    } catch (error) {
      console.error('Error creating plant:', error);
      alert('Failed to create plant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/plants')}
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Add New Plant</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>

              <div className="space-y-4">
                {/* Plant Name/Type and Image Upload - Side by Side */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Plant Name and Type Fields */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your plant's pet name
                      </label>
                      <input
                        type="text"
                        value={formData.petName}
                        onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="e.g., My Little Green Friend"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Botanical name *
                      </label>
                      <input
                        type="text"
                        value={formData.botanicalName}
                        onChange={(e) => setFormData({ ...formData, botanicalName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="e.g., Sansevieria trifasciata"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Common name *
                      </label>
                      <input
                        type="text"
                        value={formData.commonName}
                        onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="e.g., Snake Plant"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plant Type
                      </label>
                      <input
                        type="text"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="e.g., Succulent, Tropical"
                      />
                    </div>
                  </div>

                  {/* Plant Image Upload */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Plant Image
                      </label>
                      {isImageFromAI && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {getAITagMessage()}
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
                        <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center ${isAutoPopulatingImage ? 'opacity-50 pointer-events-none' : ''
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
                            className={`cursor-pointer flex flex-col items-center ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
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
                          onClick={startCamera}
                          disabled={isUploadingImage || isAutoPopulatingImage}
                          className={`w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors ${isUploadingImage || isAutoPopulatingImage ? 'opacity-50 cursor-not-allowed' : ''
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
                          onClick={deleteImage}
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
                              onClick={stopCamera}
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
                              onClick={stopCamera}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                              Capture
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Acquisition Date
                    </label>
                    <input
                      type="date"
                      value={formData.acquisitionDate}
                      onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City/Location
                    </label>
                    <CityAutocomplete
                      value={formData.city}
                      onChange={(city) => setFormData({ ...formData, city })}
                      placeholder="e.g., New York"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Care Tasks */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Care Tasks</h2>
                {!taskTemplatesLoading && selectedTasks.length === 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    No tasks selected!
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-6">Select which care tasks you'd like to set up for this plant:</p>

              {/* Available Task Templates */}
              {taskTemplatesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600">Loading care tasks...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {taskTemplates.map((template) => {
                    const isSelected = selectedTasks.some(task => task.key === template.key);
                    const selectedTask = selectedTasks.find(task => task.key === template.key);

                    return (
                      <div key={template.key} className="space-y-3">
                        {/* Task Selection Card with inline configuration */}
                        <div className={`rounded-xl border-2 transition-all ${isSelected
                            ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                          }`}>
                          <div className="flex flex-col lg:flex-row gap-4 p-4">
                            {/* Task Selection Area */}
                            <div
                              onClick={() => toggleTaskSelection(template)}
                              className={`flex items-center gap-3 cursor-pointer transition-all ${isSelected ? 'flex-1 lg:flex-none lg:w-64' : 'flex-1'
                                }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'scale-110' : ''
                                  }`}
                                style={{ borderColor: template.colorHex }}
                              >
                                {isSelected && (
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: template.colorHex }}
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-800 truncate">{template.label}</h3>
                                <p className="text-sm text-gray-600 truncate">
                                  Default: every {template.defaultFrequencyDays} days
                                </p>
                              </div>
                              {!isSelected && <div className="w-6 h-6 flex items-center justify-center text-lg flex-shrink-0">
                                {getTaskIcon(template.key)}
                              </div>}
                            </div>

                            {/* Task Configuration - appears beside selected task */}
                            {isSelected && selectedTask && (
                              <div className="flex-1 lg:flex-none lg:w-80 flex items-center gap-3 min-w-0">
                                <div className="flex-1 min-w-0">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Frequency (days)
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedTask.frequency}
                                    onChange={(e) => updateTaskFrequency(selectedTask.key, parseInt(e.target.value))}
                                    className="w-full px-2 py-1.5 text-sm rounded-md border border-gray-200 focus:ring-1 focus:ring-emerald-500 focus:border-transparent"
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Last Completed
                                  </label>
                                  <input
                                    type="date"
                                    value={selectedTask.frequency === 1 ? getTodayDateString() : (selectedTask.lastCompleted || '')}
                                    onChange={(e) => updateTaskLastCompleted(selectedTask.key, e.target.value)}
                                    max={getTodayDateString()}
                                    className={`w-full px-2 py-1.5 text-sm rounded-md border border-gray-200 focus:ring-1 focus:ring-emerald-500 focus:border-transparent ${selectedTask.frequency === 1 ? 'bg-gray-100 cursor-not-allowed' : ''
                                      }`}
                                    disabled={selectedTask.frequency === 1}
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeTask(selectedTask.key)}
                                  className="p-2 rounded-full hover:bg-gray-100 transition-colors self-end flex-shrink-0"
                                >
                                  <X className="w-4 h-4 text-gray-500" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/plants')}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.botanicalName.trim() || !formData.commonName.trim()}
                className="flex-1 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Save Plant
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confidence Notification */}
      <ConfidenceNotification
        confidence={aiConfidence || 0}
        isVisible={showConfidenceNotification}
        onClose={() => setShowConfidenceNotification(false)}
      />
    </Layout>
  );
};

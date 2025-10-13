import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { plantsAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { ArrowLeft, Plus } from 'lucide-react';
import { ConfidenceNotification } from '../components/ConfidenceNotification';
import { CloudinaryService, CloudinaryUploadResult } from '../services/cloudinaryService';
import { BasicInfoSection } from '../components/BasicInfoSection';
import { PlantCareInfoSection } from '../components/PlantCareInfoSection';
import { CareTasksSection } from '../components/CareTasksSection';
import { TutorialSpotlight } from '../components/TutorialSpotlight';
import { shouldShowTutorial, isStepDismissed, markStepCompleted, markStepSkipped, markTutorialCompleted } from '../utils/tutorial';

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

// Helper function to generate dynamic task frequency text
const getTaskFrequencyText = (template: TaskTemplate, selectedTask?: SelectedTask, aiSuggestedTask?: AISuggestedTask): string => {
  if (selectedTask) {
    const frequency = selectedTask.frequency;
    const isSuggested = selectedTask.isSuggested || false;

    if (frequency === 1) {
      return isSuggested ? 'Suggested: everyday' : 'Default: everyday';
    } else {
      const prefix = isSuggested ? 'Suggested' : 'Default';
      return `${prefix}: every ${frequency} days`;
    }
  } else if (aiSuggestedTask) {
    const frequency = aiSuggestedTask.frequency;
    if (frequency === 1) {
      return 'Suggested: everyday';
    } else {
      return `Suggested: every ${frequency} days`;
    }
  } else {
    const frequency = template.defaultFrequencyDays;
    if (frequency === 1) {
      return 'Default: everyday';
    } else {
      return `Default: every ${frequency} days`;
    }
  }
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
  isSuggested?: boolean; // Track if frequency was changed from default or set by AI
}

interface AISuggestedTask {
  key: string;
  label: string;
  colorHex: string;
  frequency: number;
  isSuggested?: boolean;
}

export const AddPlantPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [taskTemplatesLoading, setTaskTemplatesLoading] = useState(true);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  const [aiSuggestedTasks, setAiSuggestedTasks] = useState<AISuggestedTask[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    petName: '',
    botanicalName: '',
    commonName: '',
    type: '',
    acquisitionDate: '',
    city: '',
    careLevel: '',
    sunRequirements: '',
    toxicityLevel: '',
    petFriendliness: null as { isFriendly: boolean; reason: string } | null,
    commonPestsAndDiseases: '',
    preventiveMeasures: '',
  });

  // Separate state for detailed care information for cards
  const [careInfo, setCareInfo] = useState({
    careLevel: formData.careLevel,
    sunRequirements: formData.sunRequirements,
    toxicityLevel: formData.toxicityLevel,
  });

  // Sync careInfo when formData changes
  useEffect(() => {
    setCareInfo({
      careLevel: formData.careLevel,
      sunRequirements: formData.sunRequirements,
      toxicityLevel: formData.toxicityLevel,
    });
  }, [formData.careLevel, formData.sunRequirements, formData.toxicityLevel]);


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

  // Tutorial refs and state
  const basicInfoRef = useRef<HTMLDivElement>(null);
  const plantCareInfoRef = useRef<HTMLDivElement>(null);
  const careTasksRef = useRef<HTMLDivElement>(null);
  const [currentTutorialStep, setCurrentTutorialStep] = useState<'basic-info' | 'care-info' | 'tasks' | null>(null);

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
    } else if (!location.state?.fromAI) {
      // If not from AI, still start tutorial for basic info
      startTutorialSequence();
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
      // Check if there's an AI-suggested task for this template
      const aiSuggestedTask = aiSuggestedTasks.find(task => task.key === template.key);

      const newTask: SelectedTask = {
        key: template.key,
        label: template.label,
        colorHex: template.colorHex,
        frequency: aiSuggestedTask?.frequency || template.defaultFrequencyDays,
        isSuggested: !!aiSuggestedTask, // Mark as suggested if it came from AI
        ...(aiSuggestedTask?.frequency === 1 && { lastCompleted: getTodayDateString() })
      };

      setSelectedTasks([...selectedTasks, newTask]);
    }
  };

  const updateTaskFrequency = (taskKey: string, frequency: number) => {
    setSelectedTasks(selectedTasks.map(task => {
      if (task.key === taskKey) {
        const template = taskTemplates.find(t => t.key === taskKey);
        const isDefaultFrequency = template && frequency === template.defaultFrequencyDays;
        
        // If frequency is set to 1, automatically set lastCompleted to today
        if (frequency === 1) {
          return { 
            ...task, 
            frequency, 
            lastCompleted: getTodayDateString(),
            isSuggested: !isDefaultFrequency
          };
        }
        // If frequency was 1 and is now changed to something else, clear lastCompleted
        else if (task.frequency === 1) {
          return { 
            ...task, 
            frequency, 
            lastCompleted: undefined,
            isSuggested: !isDefaultFrequency
          };
        }
        // Otherwise, just update frequency and mark as suggested if not default
        return { 
          ...task, 
          frequency,
          isSuggested: !isDefaultFrequency
        };
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

      // Reset AI flag and AI suggestions when user manually uploads
      setIsImageFromAI(false);
      setAiSuggestedTasks([]);
      setAiData(null);
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
    setAiSuggestedTasks([]);
    setAiData(null); // Clear AI data when image is deleted
  };

  // Cleanup function to delete uploaded images when navigating away
  const cleanupUploadedImages = async () => {
    if (imageUploadResult) {
      try {
        console.log('Cleaning up uploaded image:', imageUploadResult.public_id);
        await CloudinaryService.deleteImage(imageUploadResult.public_id);
        console.log('Successfully deleted image from Cloudinary');
      } catch (error) {
        console.error('Error cleaning up image from Cloudinary:', error);
      }
    }

    if (imagePreview) {
      CloudinaryService.revokePreviewUrl(imagePreview);
    }
  };

  // Tutorial handlers
  const startTutorialSequence = () => {
    if (shouldShowTutorial() && !isStepDismissed('add-plant-basic-info')) {
      setTimeout(() => {
        setCurrentTutorialStep('basic-info');
      }, 500);
    }
  };

  const handleSkipTutorial = (step: 'basic-info' | 'care-info' | 'tasks') => {
    const stepMap = {
      'basic-info': 'add-plant-basic-info',
      'care-info': 'add-plant-care-info',
      'tasks': 'add-plant-tasks',
    } as const;
    
    markStepSkipped(stepMap[step]);
    setCurrentTutorialStep(null);
    
    // If skipping the last step, mark tutorial as completed
    if (step === 'tasks') {
      markTutorialCompleted();
    }
  };

  const handleNextTutorial = (step: 'basic-info' | 'care-info' | 'tasks') => {
    const stepMap = {
      'basic-info': 'add-plant-basic-info',
      'care-info': 'add-plant-care-info',
      'tasks': 'add-plant-tasks',
    } as const;
    
    markStepCompleted(stepMap[step]);

    // Move to next step or complete tutorial
    if (step === 'basic-info') {
      // Check if care info section will be visible
      if (hasProcessedAI && !isStepDismissed('add-plant-care-info')) {
        setTimeout(() => {
          setCurrentTutorialStep('care-info');
        }, 300);
      } else if (!isStepDismissed('add-plant-tasks')) {
        setTimeout(() => {
          setCurrentTutorialStep('tasks');
        }, 300);
      } else {
        setCurrentTutorialStep(null);
        markTutorialCompleted();
      }
    } else if (step === 'care-info') {
      if (!isStepDismissed('add-plant-tasks')) {
        setTimeout(() => {
          setCurrentTutorialStep('tasks');
        }, 300);
      } else {
        setCurrentTutorialStep(null);
        markTutorialCompleted();
      }
    } else if (step === 'tasks') {
      setCurrentTutorialStep(null);
      markTutorialCompleted();
    }
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

    // Start tutorial sequence after AI data is processed
    startTutorialSequence();

    // Set plant names, type, and care information from AI identification
    setFormData(prev => ({
      ...prev,
      botanicalName: aiData.botanicalName || '',
      commonName: aiData.commonName || '',
      type: aiData.plantType || '',
      careLevel: aiData.careLevel || '',
      sunRequirements: aiData.sunRequirements || '',
      toxicityLevel: aiData.toxicityLevel || '',
      petFriendliness: aiData.petFriendliness || null,
      commonPestsAndDiseases: aiData.commonPestsAndDiseases || '',
      preventiveMeasures: aiData.preventiveMeasures || '',
    }));

    // Also set the detailed care information for the cards
    setCareInfo(prev => ({
      ...prev,
      careLevel: aiData.careLevel || prev.careLevel,
      sunRequirements: aiData.sunRequirements || prev.sunRequirements,
      toxicityLevel: aiData.toxicityLevel || prev.toxicityLevel,
    }));

    // Convert AI suggested tasks to suggested tasks (not automatically selected)
    const aiTasks: AISuggestedTask[] = aiData.suggestedTasks.map((task: any) => {
      const template = taskTemplates.find(t => t.key === task.name);

      return {
        key: task.name,
        label: template?.label || task.name,
        colorHex: template?.colorHex || '#3B82F6',
        frequency: task.frequencyDays,
        isSuggested: true
      };
    });

    setAiSuggestedTasks(aiTasks);

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
        // Only include AI fields if they have values
        petFriendliness: formData.petFriendliness || undefined,
        commonPestsAndDiseases: formData.commonPestsAndDiseases || undefined,
        preventiveMeasures: formData.preventiveMeasures || undefined,
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
              onClick={async () => {
                await cleanupUploadedImages();
                navigate('/plants');
              }}
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Add New Plant</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <BasicInfoSection
              ref={basicInfoRef}
              formData={formData}
              onFormDataChange={(updates) => setFormData({ ...formData, ...updates })}
              imageUploadProps={{
                imagePreview,
                isUploadingImage,
                isAutoPopulatingImage,
                isImageFromAI,
                aiTagMessage: getAITagMessage(),
                onImageUpload: handleImageUpload,
                onDeleteImage: deleteImage,
                onStartCamera: startCamera,
                onStopCamera: stopCamera,
                onCapturePhoto: capturePhoto,
                showCamera,
                stream,
                videoRef,
              }}
            />

            {/* Plant Care Information Cards - Only show if coming from AI identification */}
            <PlantCareInfoSection
              ref={plantCareInfoRef}
              hasProcessedAI={hasProcessedAI}
              careLevel={careInfo.careLevel}
              sunRequirements={careInfo.sunRequirements}
              toxicityLevel={careInfo.toxicityLevel}
              selectedTasks={selectedTasks}
            />

            {/* Care Tasks */}
            <CareTasksSection
              ref={careTasksRef}
              taskTemplatesLoading={taskTemplatesLoading}
              taskTemplates={taskTemplates}
              selectedTasks={selectedTasks}
              aiSuggestedTasks={aiSuggestedTasks}
              onToggleTaskSelection={toggleTaskSelection}
              onUpdateTaskFrequency={updateTaskFrequency}
              onUpdateTaskLastCompleted={updateTaskLastCompleted}
              onRemoveTask={removeTask}
              getTaskIcon={getTaskIcon}
              getTaskFrequencyText={getTaskFrequencyText}
              getTodayDateString={getTodayDateString}
            />

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={async () => {
                  await cleanupUploadedImages();
                  navigate('/plants');
                }}
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

      {/* Tutorial Spotlights */}
      <TutorialSpotlight
        isVisible={currentTutorialStep === 'basic-info'}
        targetRef={basicInfoRef}
        message="Know more about your plant"
        position="right"
        onSkip={() => handleSkipTutorial('basic-info')}
        onNext={() => handleNextTutorial('basic-info')}
      />

      <TutorialSpotlight
        isVisible={currentTutorialStep === 'care-info'}
        targetRef={plantCareInfoRef}
        message="Learn how to take care of your buddy"
        position="right"
        onSkip={() => handleSkipTutorial('care-info')}
        onNext={() => handleNextTutorial('care-info')}
      />

      <TutorialSpotlight
        isVisible={currentTutorialStep === 'tasks'}
        targetRef={careTasksRef}
        message="We recommend, you choose!"
        position="right"
        onSkip={() => handleSkipTutorial('tasks')}
        onNext={() => handleNextTutorial('tasks')}
        isLastStep={true}
      />
    </Layout>
  );
};

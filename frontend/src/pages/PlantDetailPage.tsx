import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf, Edit2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { plantsAPI, plantGiftsAPI } from '../services/api';
import { TaskCompletionDialog } from '../components/TaskCompletionDialog';
import { PlantTrackingModal, PlantTrackingData } from '../components/PlantTrackingModal';
import PlantHealthModal, { PlantHealthData } from '../components/PlantHealthModal';
import { PlantTrackingViewModal } from '../components/PlantTrackingViewModal';
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog';
import { PlantCareTab } from '../components/PlantCareTab';
import { PlantHealthTab } from '../components/PlantHealthTab';
import { PlantAboutTab } from '../components/PlantAboutTab';
import { GiftPlantModal } from '../components/GiftPlantModal';
import { ShareGiftModal } from '../components/ShareGiftModal';
import { EditPlantModal } from '../components/EditPlantModal';

interface PlantTask {
  id: string;
  taskKey: string;
  frequencyDays: number;
  nextDueOn: string;
  lastCompletedOn: string | null;
  active: boolean;
}

interface PlantTrackingUpdate {
  id: string;
  plantId: string;
  date: string;
  note: string;
  photoUrl: string | null; // Optimized URL for display
  originalPhotoUrl: string | null; // Original URL for AI processing
  cloudinaryPublicId: string | null;
  createdAt: string;
}

interface Plant {
  id: string;
  petName: string | null;
  botanicalName: string | null;
  commonName: string | null;
  type: string | null;
  acquisitionDate: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
  isGifted: boolean;
  tasks: PlantTask[];
  tags: any[];
  photos: PlantPhoto[];
  petFriendliness?: {
    isFriendly: boolean;
    reason: string;
  };
  commonPestsAndDiseases?: string;
  preventiveMeasures?: string;
  _count: {
    notes: number;
    photos: number;
  };
}

interface PlantPhoto {
  id: string;
  plantId: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  takenAt: string;
  pointsAwarded: number;
}

// Helper function to get display name for plant
const getPlantDisplayName = (plant: Plant): string => {
  if (plant.petName && plant.commonName) {
    return `${plant.petName} (${plant.commonName})`;
  } else if (plant.petName) {
    return plant.petName;
  } else if (plant.commonName) {
    return plant.commonName;
  } else if (plant.botanicalName) {
    return plant.botanicalName;
  } else {
    return 'Unknown Plant';
  }
};

export function PlantDetailPage() {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [loading, setLoading] = useState(true);
  
  console.log('PlantDetailPage mounted with plantId:', plantId);
  const [activeTab, setActiveTab] = useState<'care' | 'health' | 'about'>('about');
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<PlantTask | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showMonitorHealthModal, setShowMonitorHealthModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTracking, setSelectedTracking] = useState<PlantTrackingUpdate | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [trackingToDelete, setTrackingToDelete] = useState<string | null>(null);
  const [trackingUpdates, setTrackingUpdates] = useState<PlantTrackingUpdate[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(false);
  
  // Gift modal states
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [giftToken, setGiftToken] = useState<string | null>(null);
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftLinkCopied, setGiftLinkCopied] = useState(false);
  
  // Edit plant modal state
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (plantId) {
      fetchPlant();
    }
  }, [plantId]);

  useEffect(() => {
    if (activeTab === 'health' && plantId) {
      fetchTrackingUpdates();
    }
  }, [activeTab, plantId]);

  const fetchPlant = async () => {
    try {
      const response = await plantsAPI.getById(plantId!);
      console.log('Plant fetched successfully:', response.data);
      setPlant(response.data.data);
    } catch (error) {
      console.error('Error fetching plant:', error);
      // If plant not found, it might still be processing - retry once after a delay
      if ((error as any)?.response?.status === 404) {
        console.log('Plant not found, retrying in 1 second...');
        setTimeout(async () => {
          try {
            const retryResponse = await plantsAPI.getById(plantId!);
            console.log('Plant fetched on retry:', retryResponse.data);
            setPlant(retryResponse.data.data);
          } catch (retryError) {
            console.error('Error fetching plant on retry:', retryError);
          } finally {
            setLoading(false);
          }
        }, 1000);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingUpdates = async () => {
    if (!plantId) return;

    setLoadingTracking(true);
    try {
      const response = await plantsAPI.getTrackingUpdates(plantId);
      setTrackingUpdates(response.data.data);
    } catch (error) {
      console.error('Error fetching tracking updates:', error);
    } finally {
      setLoadingTracking(false);
    }
  };


  const handleMarkComplete = (task: PlantTask) => {
    setSelectedTask(task);
    setShowTaskDialog(true);
  };

  const handleTaskComplete = async () => {
    if (!selectedTask || !plant) return;

    try {
      await plantsAPI.completeTask(plant.id, selectedTask.id);
      fetchPlant(); // Refresh plant data to update task status
      // Don't close dialog here - let TaskCompletionDialog handle it after animation
      // setShowTaskDialog(false);
      // setSelectedTask(null);
    } catch (error) {
      console.error('Error marking task complete:', error);
    }
  };

  const handleTrackPlant = () => {
    setShowTrackingModal(true);
  };

  const handleMonitorHealth = () => {
    setShowMonitorHealthModal(true);
  };

  const handleOpenTracking = (tracking: PlantTrackingUpdate) => {
    setSelectedTracking(tracking);
    setShowViewModal(true);
  };

  const handleDeleteTracking = (trackingId: string) => {
    setTrackingToDelete(trackingId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTracking = async () => {
    if (!plantId || !trackingToDelete) return;

    try {
      await plantsAPI.deleteTrackingUpdate(plantId, trackingToDelete);
      // Remove from local state after successful API call
      setTrackingUpdates(prev => prev.filter(update => update.id !== trackingToDelete));
      setShowDeleteDialog(false);
      setTrackingToDelete(null);
    } catch (error) {
      console.error('Error deleting tracking update:', error);
      // You could add a toast notification here to show the error to the user
    }
  };

  const handleGiftPlant = () => {
    setShowGiftModal(true);
  };

  const handleGiftConfirm = async (message?: string) => {
    if (!plant) return;

    setGiftLoading(true);
    try {
      const response = await plantGiftsAPI.createGift({
        plantId: plant.id,
        message,
      });
      
      setGiftToken(response.data.data.giftToken);
      setShowGiftModal(false);
      setShowShareModal(true);
    } catch (error) {
      console.error('Error creating plant gift:', error);
      // You could add a toast notification here to show the error to the user
    } finally {
      setGiftLoading(false);
    }
  };

  const handleGiftLinkCopied = () => {
    setGiftLinkCopied(true);
    setShowShareModal(false);
  };


  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading plant details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!plant) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-gray-600 mb-2">Plant not found</p>
            <button
              onClick={() => navigate('/plants')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Back to Plants
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/plants')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {plant.photos && plant.photos.length > 0 ? (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={plant.photos[0].secureUrl}
                  alt={getPlantDisplayName(plant)}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Leaf className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate" title={getPlantDisplayName(plant)}>{getPlantDisplayName(plant)}</h1>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                  title="Edit plant"
                >
                  <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              </div>
              <p className="text-sm sm:text-base text-emerald-600 truncate" title={plant.type || 'Unknown type'}>{plant.type || 'Unknown type'}</p>
            </div>
          </div>
          {giftLinkCopied ? (
            <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-2">
              <span>✓</span>
              Plant gifted!
            </div>
          ) : (
            <button
              onClick={handleGiftPlant}
              disabled={plant.isGifted || giftLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {giftLoading ? 'Creating...' : '🎁 Gift your plant'}
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'about'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('care')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'care'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Care
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'health'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Health
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'care' && (
          <PlantCareTab
            plant={plant}
            onMarkComplete={handleMarkComplete}
          />
        )}

        {activeTab === 'health' && (
          <PlantHealthTab
            plant={plant}
            trackingUpdates={trackingUpdates}
            loadingTracking={loadingTracking}
            onTrackPlant={handleTrackPlant}
            onMonitorHealth={handleMonitorHealth}
            onOpenTracking={handleOpenTracking}
            onDeleteTracking={handleDeleteTracking}
          />
        )}

        {activeTab === 'about' && (
          <PlantAboutTab plant={plant} />
        )}


      </div>
      <TaskCompletionDialog
        isOpen={showTaskDialog}
        task={selectedTask && plant ? {
          plantName: getPlantDisplayName(plant),
          taskId: selectedTask.id,
          plantId: plant.id,
          taskType: selectedTask.taskKey as 'watering' | 'fertilizing' | 'pruning' | 'spraying' | 'sunlightRotation'
        } : null}
        message="Great job! Mark this as complete? 🌱"
        onClose={() => {
          setShowTaskDialog(false);
          setSelectedTask(null);
        }}
        onConfirm={(taskId, plantId) => handleTaskComplete()}
        confirmText="Yes, Complete!"
        cancelText="No, Cancel"
        icon="🌿"
      />
      <PlantTrackingModal
        isOpen={showTrackingModal}
        plantName={getPlantDisplayName(plant!)}
        plantId={plant?.id || ''}
        onClose={() => setShowTrackingModal(false)}
        onSubmit={async (data: PlantTrackingData) => {
          if (!plant?.id) return;
          try {
            await plantsAPI.createTrackingUpdate(plant.id, data);
            setShowTrackingModal(false);
            // Refresh tracking updates to show the new one
            fetchTrackingUpdates();
          } catch (error) {
            console.error('Error creating tracking update:', error);
          }
        }}
      />
      <PlantHealthModal
        isOpen={showMonitorHealthModal}
        plantName={getPlantDisplayName(plant!)}
        plantId={plant?.id || ''}
        onClose={() => setShowMonitorHealthModal(false)}
        onSubmit={async (data: PlantTrackingData) => {
          if (!plant?.id) return;
          try {
            await plantsAPI.createTrackingUpdate(plant.id, data);
            setShowMonitorHealthModal(false);
            // Refresh tracking updates to show the new one
            fetchTrackingUpdates();
          } catch (error) {
            console.error('Error creating tracking update:', error);
          }
        }}
      />
      <PlantTrackingViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        tracking={selectedTracking || {
          id: '',
          plantId: '',
          date: '',
          note: '',
          photoUrl: null,
          cloudinaryPublicId: null,
          createdAt: ''
        }}
      />
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setTrackingToDelete(null);
        }}
        onConfirm={confirmDeleteTracking}
        title="Delete Tracking Update"
        message="Are you sure you want to delete this tracking update? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      <GiftPlantModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        onConfirm={handleGiftConfirm}
        plantName={getPlantDisplayName(plant!)}
        plantImage={plant?.photos && plant.photos.length > 0 ? plant.photos[0].secureUrl : undefined}
      />
      <ShareGiftModal
        isOpen={showShareModal}
        onClose={handleGiftLinkCopied}
        plantName={getPlantDisplayName(plant!)}
        giftToken={giftToken || ''}
      />
      <EditPlantModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        plantId={plant?.id || ''}
        currentNickname={plant?.petName || null}
        currentPhoto={plant?.photos && plant.photos.length > 0 ? {
          id: plant.photos[0].id,
          secureUrl: plant.photos[0].secureUrl,
          cloudinaryPublicId: plant.photos[0].cloudinaryPublicId,
        } : null}
        onUpdate={() => {
          fetchPlant();
        }}
      />
    </Layout>
  );
}

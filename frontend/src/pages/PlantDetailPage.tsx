import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Droplets, Scissors, Sun, Leaf, Edit, CheckCircle, ClockAlert } from 'lucide-react';
import { Layout } from '../components/Layout';
import { plantsAPI } from '../services/api';
import { TaskCompletionDialog } from '../components/TaskCompletionDialog';
import { PlantTrackingModal, PlantTrackingData } from '../components/PlantTrackingModal';
import PlantHealthModal, { PlantHealthData } from '../components/PlantHealthModal';
import { PlantActionButtons } from '../components/PlantActionButtons';
import { PlantTrackingCard } from '../components/PlantTrackingCard';
import { PlantTrackingViewModal } from '../components/PlantTrackingViewModal';
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog';
import { differenceInDays } from 'date-fns';

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
  tasks: PlantTask[];
  tags: any[];
  photos: PlantPhoto[];
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
  const [activeTab, setActiveTab] = useState<'care' | 'health' | 'about'>('care');
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
      setPlant(response.data.data);
    } catch (error) {
      console.error('Error fetching plant:', error);
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

  const getTaskStatus = (task: PlantTask) => {
    const now = new Date();
    const nextDue = new Date(task.nextDueOn);
    const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      return { status: 'overdue', text: 'Overdue', color: 'text-red-600' };
    } else if (daysUntilDue === 0) {
      return { status: 'due-today', text: 'Next: Today', color: 'text-blue-600' };
    } else if (daysUntilDue === 1) {
      return { status: 'due-tomorrow', text: 'Next: Tomorrow', color: 'text-yellow-600' };
    } else {
      return { status: 'upcoming', text: `Next: in ${daysUntilDue} days`, color: 'text-gray-600' };
    }
  };

  const getFrequencyText = (frequencyDays: number) => {
    if (frequencyDays === 1) return 'Every day';
    if (frequencyDays === 2) return 'Every 2 days';
    if (frequencyDays === 7) return 'Every week';
    if (frequencyDays === 14) return 'Every 2 weeks';
    if (frequencyDays === 30) return 'Every month';
    if (frequencyDays === 90) return 'Every 3 months';
    if (frequencyDays === 180) return 'Every 6 months';
    if (frequencyDays === 365) return 'Every year';
    if (frequencyDays === 540) return 'Every 18 months';
    return `Every ${frequencyDays} days`;
  };

  const getTaskIcon = (taskKey: string) => {
    switch (taskKey) {
      case 'watering':
        return <Droplets className="w-4 h-4 text-blue-600" />;
      case 'fertilizing':
        return <Leaf className="w-4 h-4 text-green-600" />;
      case 'pruning':
        return <Scissors className="w-4 h-4 text-pink-600" />;
      case 'spraying':
        return <Droplets className="w-4 h-4 text-orange-600" />;
      case 'sunlightRotation':
        return <Sun className="w-4 h-4 text-purple-600" />;
      default:
        return <Leaf className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTaskName = (taskKey: string) => {
    switch (taskKey) {
      case 'watering':
        return 'Water';
      case 'fertilizing':
        return 'Fertilize';
      case 'pruning':
        return 'Prune';
      case 'spraying':
        return 'Spray';
      case 'sunlightRotation':
        return 'Rotate';
      default:
        return 'Task';
    }
  };

  const getOverdueTasks = () => {
    if (!plant) return [];

    return plant.tasks.filter(task => {
      // Check if task was completed today
      const isCompletedToday = task.lastCompletedOn ?
        Math.abs(new Date(task.lastCompletedOn).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000 : false;

      // Skip if completed today
      if (isCompletedToday) return false;

      // Check if task is overdue (nextDueOn < today)
      const nextDue = new Date(task.nextDueOn);
      const today = new Date();
      const dueDate = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate());
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      return dueDate < todayDate;
    });
  };

  const getTodayTasks = () => {
    if (!plant) return [];

    return plant.tasks.filter(task => {
      // Check if task was completed today
      const isCompletedToday = task.lastCompletedOn ?
        Math.abs(new Date(task.lastCompletedOn).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000 : false;

      // Skip if completed today
      if (isCompletedToday) return false;

      // For daily tasks, always show if not completed today
      if (task.frequencyDays === 1) return true;

      // For other frequencies, check if due today (exactly today, not tomorrow)
      const nextDue = new Date(task.nextDueOn);
      const today = new Date();
      
      // Compare dates without time components
      const nextDueDate = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate());
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      return nextDueDate.getTime() === todayDate.getTime(); // Only tasks due exactly today
    });
  };

  const getUpcomingTasks = () => {
    if (!plant) return [];

    const upcomingTasks: Array<{ task: PlantTask; dueDate: Date; daysUntilDue: number }> = [];

    plant.tasks.forEach(task => {
      if (task.frequencyDays === 1) {
        // For daily tasks, generate future occurrences starting from tomorrow
        const today = new Date();
        for (let i = 1; i <= 5; i++) { // Show next 5 days
          const dueDate = new Date(today);
          dueDate.setDate(today.getDate() + i);

          upcomingTasks.push({
            task,
            dueDate,
            daysUntilDue: i
          });
        }
      } else {
        // For non-daily tasks, generate future occurrences based on frequency
        const today = new Date();
        const baseDate = new Date(task.nextDueOn);

        // Generate next 5 occurrences based on frequency
        for (let i = 0; i < 5; i++) {
          const dueDate = new Date(baseDate);
          dueDate.setDate(baseDate.getDate() + (i * task.frequencyDays));

          // Only include future dates
          if (dueDate > today) {
            const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            upcomingTasks.push({
              task,
              dueDate,
              daysUntilDue
            });
          }
        }
      }
    });

    // Sort by days until due (most urgent first)
    upcomingTasks.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    // Limit to 5 tasks
    return upcomingTasks.slice(0, 5);
  };

  const getHistoryTasks = () => {
    if (!plant) return [];

    const today = new Date();

    return plant.tasks
      .filter(task => task.lastCompletedOn)
      .map(task => {
        const completedDate = new Date(task.lastCompletedOn!);
        const daysSinceCompleted = differenceInDays(today, completedDate);

        let timeText = '';
        if (daysSinceCompleted === 0) {
          timeText = 'Completed today';
        } else if (daysSinceCompleted === 1) {
          timeText = 'Completed yesterday';
        } else {
          timeText = `Completed ${daysSinceCompleted} days back`;
        }

        return { ...task, timeText, daysSinceCompleted };
      })
      .sort((a, b) => b.daysSinceCompleted - a.daysSinceCompleted) // Most recent first
      .slice(0, 3); // Limit to 3 tasks
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
      setShowTaskDialog(false);
      setSelectedTask(null);
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
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate" title={getPlantDisplayName(plant)}>{getPlantDisplayName(plant)}</h1>
              <p className="text-sm sm:text-base text-emerald-600 truncate" title={plant.type || 'Unknown type'}>{plant.type || 'Unknown type'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
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
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'about'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            About
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'care' && (
          <div className="space-y-6">
            {/* Care Tasks Grid - Horizontal Scrollable */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
              {/* Water */}
              {plant.tasks.find(t => t.taskKey === 'watering') && (
                <div className="bg-white rounded-lg p-4 border border-gray-200 w-48">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Droplets className="w-5 h-5 text-blue-600" />
                    </div>
                    <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">Water</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {getFrequencyText(plant.tasks.find(t => t.taskKey === 'watering')!.frequencyDays)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {(() => {
                      const waterTask = plant.tasks.find(t => t.taskKey === 'watering');
                      // Check if task was completed today (within 24 hours)
                      const isCompletedToday = waterTask!.lastCompletedOn ?
                        Math.abs(new Date(waterTask!.lastCompletedOn).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000 : false;

                      if (isCompletedToday) return (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Done for today</span>
                        </div>
                      );

                      const now = new Date();
                      const nextDue = new Date(waterTask!.nextDueOn);
                      const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                      if (daysUntilDue < 0) return (
                        <div className="flex items-center gap-2">
                          <ClockAlert className="w-4 h-4 text-red-600" />
                          <span className="text-red-600 font-medium">Overdue</span>
                        </div>
                      );
                      if (daysUntilDue === 0) return (<span className="text-blue-600 font-medium">Due Today</span>);
                      if (daysUntilDue === 1) return (<span className="text-blue-600 font-medium">Due Tomorrow</span>);
                      return `In ${daysUntilDue} days`;
                    })()}
                  </p>
                </div>
              )}

              {/* Fertilize */}
              {plant.tasks.find(t => t.taskKey === 'fertilizing') && (
                <div className="bg-white rounded-lg p-4 border border-gray-200 w-48">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Leaf className="w-5 h-5 text-green-600" />
                    </div>
                    <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">Fertilize</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {getFrequencyText(plant.tasks.find(t => t.taskKey === 'fertilizing')!.frequencyDays)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {(() => {
                      const fertilizeTask = plant.tasks.find(t => t.taskKey === 'fertilizing');
                      // Check if task was completed today (within 24 hours)
                      const isCompletedToday = fertilizeTask!.lastCompletedOn ?
                        Math.abs(new Date(fertilizeTask!.lastCompletedOn).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000 : false;

                      if (isCompletedToday) return (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Done for today</span>
                        </div>
                      );

                      const now = new Date();
                      const nextDue = new Date(fertilizeTask!.nextDueOn);
                      const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                      if (daysUntilDue < 0) return (
                        <div className="flex items-center gap-2">
                          <ClockAlert className="w-4 h-4 text-red-600" />
                          <span className="text-red-600 font-medium">Overdue</span>
                        </div>
                      );
                      if (daysUntilDue === 0) return (<span className="text-blue-600 font-medium">Due Today</span>);
                      if (daysUntilDue === 1) return (<span className="text-blue-600 font-medium">Due Tomorrow</span>);
                      return `In ${daysUntilDue} days`;
                    })()}
                  </p>
                </div>
              )}

              {/* Prune */}
              {plant.tasks.find(t => t.taskKey === 'pruning') && (
                <div className="bg-white rounded-lg p-4 border border-gray-200 w-48">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <Scissors className="w-5 h-5 text-pink-600" />
                    </div>
                    <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">Prune</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {getFrequencyText(plant.tasks.find(t => t.taskKey === 'pruning')!.frequencyDays)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {(() => {
                      const pruneTask = plant.tasks.find(t => t.taskKey === 'pruning');
                      // Check if task was completed today (within 24 hours)
                      const isCompletedToday = pruneTask!.lastCompletedOn ?
                        Math.abs(new Date(pruneTask!.lastCompletedOn).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000 : false;

                      if (isCompletedToday) return (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Done for today</span>
                        </div>
                      );

                      const now = new Date();
                      const nextDue = new Date(pruneTask!.nextDueOn);
                      const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                      if (daysUntilDue < 0) return (
                        <div className="flex items-center gap-2">
                          <ClockAlert className="w-4 h-4 text-red-600" />
                          <span className="text-red-600 font-medium">Overdue</span>
                        </div>
                      );
                      if (daysUntilDue === 0) return (<span className="text-blue-600 font-medium">Due Today</span>);
                      if (daysUntilDue === 1) return (<span className="text-blue-600 font-medium">Due Tomorrow</span>);
                      return `In ${daysUntilDue} days`;
                    })()}
                  </p>
                </div>
              )}

              {/* Spray */}
              {plant.tasks.find(t => t.taskKey === 'spraying') && (
                <div className="bg-white rounded-lg p-4 border border-gray-200 w-48">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Droplets className="w-5 h-5 text-orange-600" />
                    </div>
                    <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">Spray</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {getFrequencyText(plant.tasks.find(t => t.taskKey === 'spraying')!.frequencyDays)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {(() => {
                      const sprayTask = plant.tasks.find(t => t.taskKey === 'spraying');
                      // Check if task was completed today (within 24 hours)
                      const isCompletedToday = sprayTask!.lastCompletedOn ?
                        Math.abs(new Date(sprayTask!.lastCompletedOn).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000 : false;

                      if (isCompletedToday) return (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Done for today</span>
                        </div>
                      );

                      const now = new Date();
                      const nextDue = new Date(sprayTask!.nextDueOn);
                      const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                      if (daysUntilDue < 0) return (
                        <div className="flex items-center gap-2">
                          <ClockAlert className="w-4 h-4 text-red-600" />
                          <span className="text-red-600 font-medium">Overdue</span>
                        </div>
                      );
                      if (daysUntilDue === 0) return (<span className="text-blue-600 font-medium">Due Today</span>);
                      if (daysUntilDue === 1) return (<span className="text-blue-600 font-medium">Due Tomorrow</span>);
                      return `In ${daysUntilDue} days`;
                    })()}
                  </p>
                </div>
              )}

              {/* Rotate */}
              {plant.tasks.find(t => t.taskKey === 'sunlightRotation') && (
                <div className="bg-white rounded-lg p-4 border border-gray-200 w-48">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Sun className="w-5 h-5 text-purple-600" />
                    </div>
                    <button className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <Edit className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">Rotate</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {getFrequencyText(plant.tasks.find(t => t.taskKey === 'sunlightRotation')!.frequencyDays)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {(() => {
                      const rotateTask = plant.tasks.find(t => t.taskKey === 'sunlightRotation');
                      // Check if task was completed today (within 24 hours)
                      const isCompletedToday = rotateTask!.lastCompletedOn ?
                        Math.abs(new Date(rotateTask!.lastCompletedOn).getTime() - new Date().getTime()) < 24 * 60 * 60 * 1000 : false;

                      if (isCompletedToday) return (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Done for today</span>
                        </div>
                      );

                      const now = new Date();
                      const nextDue = new Date(rotateTask!.nextDueOn);
                      const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                      if (daysUntilDue < 0) return (
                        <div className="flex items-center gap-2">
                          <ClockAlert className="w-4 h-4 text-red-600" />
                          <span className="text-red-600 font-medium">Overdue</span>
                        </div>
                      );
                      if (daysUntilDue === 0) return (<span className="text-blue-600 font-medium">Due Today</span>);
                      if (daysUntilDue === 1) return (<span className="text-blue-600 font-medium">Due Tomorrow</span>);
                      return `In ${daysUntilDue} days`;
                    })()}
                  </p>
                </div>
              )}
              </div>
            </div>

            {/* Three Sections */}
            <div className="space-y-6">
              {/* Overdue Section */}
              {getOverdueTasks().length > 0 && (
                <div className="bg-white rounded-lg p-4 sm:p-6 border border-red-200">
                  <div className="mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-red-600 mb-2">Overdue</h2>
                    <p className="text-sm text-red-500">Needs immediate attention</p>
                  </div>
                  <div className="space-y-3">
                    {getOverdueTasks().map((task) => (
                      <div key={task.id} className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          {getTaskIcon(task.taskKey)}
                          <span className="font-medium text-gray-800 text-sm sm:text-base truncate">{getTaskName(task.taskKey)}</span>
                        </div>
                        <button
                          onClick={() => handleMarkComplete(task)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-shrink-0"
                        >
                          <span className="hidden sm:inline">Mark Complete</span>
                          <span className="sm:hidden">Complete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Today Section */}
              <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                <div className="mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Today</h2>
                  <p className="text-sm text-gray-500">Tap on each task for instructions</p>
                </div>
                {getTodayTasks().length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tasks due today</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getTodayTasks().map((task) => (
                      <div key={task.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          {getTaskIcon(task.taskKey)}
                          <span className="font-medium text-gray-800 text-sm sm:text-base truncate">{getTaskName(task.taskKey)}</span>
                        </div>
                        <button
                          onClick={() => handleMarkComplete(task)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-shrink-0"
                        >
                          <span className="hidden sm:inline">Mark Complete</span>
                          <span className="sm:hidden">Complete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Section */}
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Upcoming</h3>
                  <button className="px-3 py-1 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors">
                    View all
                  </button>
                </div>

                {getUpcomingTasks().length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No upcoming tasks</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getUpcomingTasks().map((item, index) => (
                      <div key={`${item.task.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <span className="text-lg flex-shrink-0">{getTaskIcon(item.task.taskKey)}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{getTaskName(item.task.taskKey)}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {item.daysUntilDue === 1 ? 'Due tomorrow' : `Due in ${item.daysUntilDue} days`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* History Section */}
              <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">History</h2>
                  <button className="px-3 sm:px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors">
                    History
                  </button>
                </div>
                {getHistoryTasks().length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No completed tasks yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getHistoryTasks().map((task) => (
                      <div key={task.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          {getTaskIcon(task.taskKey)}
                          <span className="font-medium text-gray-800 text-sm sm:text-base truncate">{getTaskName(task.taskKey)}</span>
                        </div>
                        <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">
                          {task.timeText}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="flex flex-col">
            {/* Action Buttons - Centered in remaining space */}
            <div className={`flex items-center justify-center ${trackingUpdates.length > 0 ? 'py-8' : 'min-h-[60vh]'}`}>
              <PlantActionButtons
                plantName={getPlantDisplayName(plant!)}
                onTrackPlant={handleTrackPlant}
                onMonitorHealth={handleMonitorHealth}
              />
            </div>

            {/* Tracking Updates - Only show if there are updates */}
            {trackingUpdates.length > 0 && (
              <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Tracking Updates</h2>
                {loadingTracking ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading tracking updates...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trackingUpdates.map((update) => (
                      <PlantTrackingCard
                        key={update.id}
                        tracking={update}
                        onOpen={handleOpenTracking}
                        onDelete={handleDeleteTracking}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">About</h2>
            <p className="text-gray-600">About section content will be implemented later.</p>
          </div>
        )}
      </div>
      <TaskCompletionDialog
        isOpen={showTaskDialog}
        task={{
          plantName: getPlantDisplayName(plant!),
          taskId: selectedTask?.id || '',
          plantId: plant?.id || ''
        }}
        message="Great job! Mark this as complete? 🌱"
        onClose={() => setShowTaskDialog(false)}
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
    </Layout>
  );
}

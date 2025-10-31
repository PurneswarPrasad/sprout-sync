import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI, plantsAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { AddPlantModal } from '../components/AddPlantModal';
import { SwipeToDeleteCardRef } from '../components/SwipeToDeleteCard';
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog';
import { TaskCompletionDialog } from '../components/TaskCompletionDialog';
import { StatsCards } from '../components/StatsCards';
import { PlantsSection } from '../components/PlantsSection';
import { TasksSection } from '../components/TasksSection';
import { OverdueSection } from '../components/OverdueSection';
import { TutorialSpotlight } from '../components/TutorialSpotlight';
import { shouldShowTutorial, isStepDismissed, markStepCompleted, markStepSkipped, initTutorialState } from '../utils/tutorial';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  createdAt: string;
}

interface PlantTask {
  id: string;
  taskKey: string;
  frequencyDays: number;
  nextDueOn: string;
  active: boolean;
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

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPlantModal, setShowAddPlantModal] = useState(false);
  
  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    plantId: string | null;
    plantName: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    plantId: null,
    plantName: '',
    isLoading: false,
  });

  // Task completion confirmation state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    task: { plantName: string; taskId: string; plantId: string; taskType: 'watering' | 'fertilizing' | 'pruning' | 'spraying' | 'sunlightRotation' } | null;
    message: string;
  }>({
    isOpen: false,
    task: null,
    message: '',
  });

  // Refs to track swipe cards for resetting when delete is cancelled
  const swipeCardRefs = useRef<{ [key: string]: SwipeToDeleteCardRef | null }>({});

  // Tutorial refs and state
  const fabButtonRef = useRef<HTMLButtonElement>(null);
  const [showHomepageTutorial, setShowHomepageTutorial] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await fetchUserProfile();
      
      // Initialize tutorial state from API
      await initTutorialState();
      
      // Check if we should show tutorial
      if (shouldShowTutorial() && !isStepDismissed('homepage-add-button')) {
        // Delay to let the page render first
        setTimeout(() => {
          setShowHomepageTutorial(true);
        }, 500);
      }
    };
    
    initialize();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPlants();
    }
  }, [user]);

  // Refresh plants when navigating from AddPlantPage or after task update
  useEffect(() => {
    if (location.state?.plantCreated || location.state?.taskUpdated) {
      fetchPlants();
      // Clear the state to prevent re-fetching
      navigate(location.pathname, { replace: true });
    }
  }, [location.state]);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.profile();
      
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        setError('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Authentication required');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlants = async () => {
    try {
      const response = await plantsAPI.getAll();
      setPlants(response.data.data);
    } catch (error) {
      console.error('Error fetching plants:', error);
    }
  };

  const getTaskIcon = (taskKey: string) => {
    switch (taskKey) {
      case 'watering':
        return '💧';
      case 'fertilizing':
        return '🌱';
      case 'pruning':
        return '✂️';
      case 'spraying':
        return '💨';
      case 'sunlightRotation':
        return '☀️';
      default:
        return '📋';
    }
  };

  const getTaskDisplayName = (taskKey: string) => {
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
        return taskKey;
    }
  };

  // Get task status based on due date
  const getTaskStatus = (task: PlantTask) => {
    const now = new Date();
    const nextDue = new Date(task.nextDueOn);
    
    // Set both dates to start of day for accurate comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate());
    
    // Removed: lastCompletedOn tracking - no "completed today" check
    
    // Calculate days until due for display purposes
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determine status based on due date comparison
    if (dueDate < today) {
      return { status: 'overdue', text: 'Overdue', color: 'text-red-600' };
    } else if (dueDate.getTime() === today.getTime()) {
      return { status: 'due-today', text: 'Due today', color: 'text-blue-600' };
    } else if (daysUntilDue === 1) {
      return { status: 'due-tomorrow', text: 'Due tomorrow', color: 'text-yellow-600' };
    } else if (daysUntilDue <= 2) {
      return { status: 'due-soon', text: `Due in ${daysUntilDue} days`, color: 'text-yellow-600' };
    } else {
      return { status: 'upcoming', text: `Due in ${daysUntilDue} days`, color: 'text-gray-600' };
    }
  };

  const getPlantHealth = (plant: Plant) => {
    const overdueTasks = plant.tasks.filter(task => {
      const now = new Date();
      const nextDue = new Date(task.nextDueOn);
      return nextDue < now && task.active;
    });

    if (overdueTasks.length > 0) {
      return { status: 'needs-care', color: 'bg-yellow-500' };
    }
    return { status: 'healthy', color: 'bg-green-500' };
  };

  // Delete plant functions
  const openDeleteDialog = (plantId: string, plantName: string) => {
    setDeleteDialog({
      isOpen: true,
      plantId,
      plantName,
      isLoading: false,
    });
  };

  const closeDeleteDialog = () => {
    // Reset the swipe card if delete was cancelled
    if (deleteDialog.plantId && swipeCardRefs.current[deleteDialog.plantId]) {
      swipeCardRefs.current[deleteDialog.plantId]?.reset();
    }
    
    setDeleteDialog({
      isOpen: false,
      plantId: null,
      plantName: '',
      isLoading: false,
    });
  };

  const handleDeletePlant = async () => {
    if (!deleteDialog.plantId) return;

    setDeleteDialog(prev => ({ ...prev, isLoading: true }));

    try {
      await plantsAPI.delete(deleteDialog.plantId);

      // Remove the plant from the local state
      setPlants(prev => prev.filter(plant => plant.id !== deleteDialog.plantId));
      
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting plant:', error);
      alert('Failed to delete plant. Please try again.');
    } finally {
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Task completion functions
  const openConfirmDialog = (task: PlantTask, plant: Plant) => {
    const messages = [
      "Great job! Mark this as complete? 🌱",
      "Excellent work! Ready to mark this task as done? ✨",
      "You're doing amazing! Complete this task? 🌿",
      "Fantastic progress! Mark this as finished? 🌟",
      "Keep up the great work! Ready to complete this? 💚"
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    setConfirmDialog({
      isOpen: true,
      task: {
        plantName: getPlantDisplayName(plant),
        taskId: task.id,
        plantId: plant.id,
        taskType: task.taskKey as 'watering' | 'fertilizing' | 'pruning' | 'spraying' | 'sunlightRotation',
      },
      message: randomMessage,
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      task: null,
      message: '',
    });
  };

  const markTaskComplete = async (taskId: string, plantId: string) => {
    try {
      await plantsAPI.completeTask(plantId, taskId);
      
      // Don't close dialog here - let TaskCompletionDialog handle it after animation
      // The dialog will call onClose (closeConfirmDialog) when animation completes
      
      // Refresh plants data to ensure consistency
      fetchPlants();
    } catch (error) {
      console.error('Error marking task complete:', error);
    }
  };

  // Tutorial handlers
  const handleSkipHomepageTutorial = () => {
    markStepSkipped('homepage-add-button');
    setShowHomepageTutorial(false);
  };

  const handleNextHomepageTutorial = () => {
    markStepCompleted('homepage-add-button');
    setShowHomepageTutorial(false);
    // Trigger the add plant modal
    setShowAddPlantModal(true);
  };

  // Get tasks that are due today (nextDueOn = today)
  const getTodaysTasks = (): Array<{ task: PlantTask; plant: Plant; status: { status: string; text: string; color: string }; isCompleted: boolean }> => {
    return plants.flatMap(plant => 
      plant.tasks
        .filter(task => task.active)
        .map(task => {
          const now = new Date();
          const nextDue = new Date(task.nextDueOn);
          
          // Set both dates to start of day for accurate comparison
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const dueDate = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate());
          
          // Only include tasks that are due today (dueDate === today)
          if (dueDate.getTime() === today.getTime()) {
            const status = getTaskStatus(task);
            
            return {
              task,
              plant,
              status,
              isCompleted: false
            };
          }
          return null;
        })
        .filter((item): item is { task: PlantTask; plant: Plant; status: { status: string; text: string; color: string }; isCompleted: boolean } => item !== null)
    );
  };

  // Get tasks that are overdue (nextDueOn < today)
  const getOverdueTasks = (): Array<{ task: PlantTask; plant: Plant; status: { status: string; text: string; color: string }; isCompleted: boolean }> => {
    return plants.flatMap(plant => 
      plant.tasks
        .filter(task => task.active)
        .map(task => {
          const now = new Date();
          const nextDue = new Date(task.nextDueOn);
          
          // Set both dates to start of day for accurate comparison
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const dueDate = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate());
          
          // Only include tasks that are overdue (dueDate < today)
          if (dueDate < today) {
            const status = getTaskStatus(task);
            
            return {
              task,
              plant,
              status,
              isCompleted: false
            };
          }
          return null;
        })
        .filter((item): item is { task: PlantTask; plant: Plant; status: { status: string; text: string; color: string }; isCompleted: boolean } => item !== null)
    );
  };

  // Dashboard stats calculation
  const totalPlants = plants.length;
  const todaysTasksCount = getTodaysTasks().filter(({ isCompleted }) => !isCompleted).length;
  const overdueTasksCount = getOverdueTasks().filter(({ isCompleted }) => !isCompleted).length;
  // Removed: completedTasksCount calculation (no lastCompletedOn tracking)
  const completedTasksCount = 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your garden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-gray-600 mb-2">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout fabRef={fabButtonRef}>
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            Your Garden Dashboard
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Track your plants, manage care tasks, and watch your garden flourish
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalPlants={totalPlants}
          todaysTasksCount={todaysTasksCount}
          overdueTasksCount={overdueTasksCount}
          completedTasksCount={completedTasksCount}
          firstName={user?.name?.split(' ')[0]}
        />

        {/* Content Grid */}
        <div className="flex xl:grid xl:grid-cols-3 gap-4 sm:gap-6 xl:gap-8 overflow-x-auto xl:overflow-visible scrollbar-hide snap-x snap-mandatory pb-2 px-4 sm:px-6 xl:px-0">
          {/* Plants Section */}
          <div className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[55vw] xl:w-auto xl:flex-shrink xl:min-w-0 snap-start">
            <PlantsSection
              plants={plants}
              onAddPlant={() => setShowAddPlantModal(true)}
              onPlantClick={(plantId) => navigate(`/plants/${plantId}`)}
              onDeletePlant={openDeleteDialog}
              getPlantDisplayName={getPlantDisplayName}
              getPlantHealth={getPlantHealth}
              getTaskIcon={getTaskIcon}
              getTaskStatus={getTaskStatus}
              swipeCardRefs={swipeCardRefs}
            />
          </div>

          {/* Tasks Section */}
          <div className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[55vw] xl:w-auto xl:flex-shrink xl:min-w-0 snap-start">
            <TasksSection
              tasks={getTodaysTasks()}
              onViewAll={() => navigate('/calendar')}
              onTaskComplete={openConfirmDialog}
              getTaskIcon={getTaskIcon}
              getTaskDisplayName={getTaskDisplayName}
              getPlantDisplayName={getPlantDisplayName}
            />
          </div>

          {/* Overdue Tasks Section */}
          <div className="flex-shrink-0 w-[85vw] sm:w-[70vw] md:w-[55vw] xl:w-auto xl:flex-shrink xl:min-w-0 snap-start">
            <OverdueSection
              tasks={getOverdueTasks()}
              onViewAll={() => navigate('/calendar')}
              onTaskComplete={openConfirmDialog}
              getTaskIcon={getTaskIcon}
              getTaskDisplayName={getTaskDisplayName}
              getPlantDisplayName={getPlantDisplayName}
            />
          </div>
        </div>
      </div>

      {/* Add Plant Modal */}
      <AddPlantModal
        isOpen={showAddPlantModal}
        onClose={() => setShowAddPlantModal(false)}
        onManualEntry={() => {
          setShowAddPlantModal(false);
          navigate('/add-plant');
        }}
        onCameraID={() => {
          setShowAddPlantModal(false);
          navigate('/ai-identification');
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeletePlant}
        title="Delete Plant"
        message={`Are you sure you want to delete "${deleteDialog.plantName}"? It will be permanently deleted!`}
        confirmText="Delete Plant"
        cancelText="Cancel"
        isLoading={deleteDialog.isLoading}
      />

      {/* Task Completion Dialog */}
      <TaskCompletionDialog
        isOpen={confirmDialog.isOpen}
        task={confirmDialog.task}
        message={confirmDialog.message}
        onClose={closeConfirmDialog}
        onConfirm={markTaskComplete}
      />

      {/* Tutorial Spotlight */}
      <TutorialSpotlight
        isVisible={showHomepageTutorial}
        targetRef={fabButtonRef}
        message="Click here to meet your first plant friend!"
        position="left"
        onSkip={handleSkipHomepageTutorial}
        onNext={handleNextHomepageTutorial}
      />
    </Layout>
  );
};

export default HomePage;
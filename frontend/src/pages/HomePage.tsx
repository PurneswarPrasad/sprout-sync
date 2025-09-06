import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { authAPI, plantsAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { AddPlantModal } from '../components/AddPlantModal';
import { SwipeToDeleteCard, SwipeToDeleteCardRef } from '../components/SwipeToDeleteCard';
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog';
import { TaskCompletionDialog } from '../components/TaskCompletionDialog';

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
  lastCompletedOn: string | null;
  active: boolean;
}

interface Plant {
  id: string;
  name: string;
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
    task: { plantName: string; taskId: string; plantId: string } | null;
    message: string;
  }>({
    isOpen: false,
    task: null,
    message: '',
  });

  // Refs to track swipe cards for resetting when delete is cancelled
  const swipeCardRefs = useRef<{ [key: string]: SwipeToDeleteCardRef | null }>({});

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPlants();
    }
  }, [user]);

  // Refresh plants when navigating from AddPlantPage
  useEffect(() => {
    if (location.state?.plantCreated) {
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

  // Get task status based on due date
  const getTaskStatus = (task: PlantTask) => {
    const now = new Date();
    const nextDue = new Date(task.nextDueOn);
    
    // Set both dates to start of day for accurate comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDate = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate());
    
    // Check if task was completed today
    const isCompletedToday = task.lastCompletedOn ? 
      Math.abs(new Date(task.lastCompletedOn).getTime() - now.getTime()) < 24 * 60 * 60 * 1000 : false;
    
    // If task was completed today, show "Done"
    if (isCompletedToday) {
      return { status: 'completed', text: 'Done', color: 'text-green-600' };
    }
    
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
        plantName: plant.name,
        taskId: task.id,
        plantId: plant.id,
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
      
      // Close dialog
      closeConfirmDialog();
      
      // Refresh plants data to ensure consistency
      fetchPlants();
    } catch (error) {
      console.error('Error marking task complete:', error);
    }
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
          
          // Check if task was completed today
          const isCompleted = task.lastCompletedOn ? 
            Math.abs(new Date(task.lastCompletedOn).getTime() - now.getTime()) < 24 * 60 * 60 * 1000 : false;
          
          // Only include tasks that are due today (dueDate === today)
          if (dueDate.getTime() === today.getTime()) {
            const status = getTaskStatus(task);
            
            return {
              task,
              plant,
              status,
              isCompleted
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
          
          // Check if task was completed today
          const isCompleted = task.lastCompletedOn ? 
            Math.abs(new Date(task.lastCompletedOn).getTime() - now.getTime()) < 24 * 60 * 60 * 1000 : false;
          
          // Only include tasks that are overdue (dueDate < today)
          if (dueDate < today) {
            const status = getTaskStatus(task);
            
            return {
              task,
              plant,
              status,
              isCompleted
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
  const completedTasksCount = plants.reduce((total, plant) => {
    const completed = plant.tasks.filter(task => {
      if (!task.active) return false;
      if (!task.lastCompletedOn) return false;
      
      // A task is considered completed only if it was completed today
      const now = new Date();
      const lastCompleted = new Date(task.lastCompletedOn);
      return Math.abs(lastCompleted.getTime() - now.getTime()) < 24 * 60 * 60 * 1000;
    });
    return total + completed.length;
  }, 0);

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
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Your Garden Dashboard
          </h2>
          <p className="text-gray-600">
            Track your plants, manage care tasks, and watch your garden flourish
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Plants</p>
                <p className="text-3xl font-bold text-emerald-600">{totalPlants}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🌿</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Tasks</p>
                <p className="text-3xl font-bold text-blue-600">{todaysTasksCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{overdueTasksCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedTasksCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plants Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Your Plants</h3>
              <button 
                onClick={() => setShowAddPlantModal(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200"
              >
                Add Plant
              </button>
            </div>
            
            {plants.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🌱</span>
                </div>
                <p className="text-gray-600 mb-4">No plants yet</p>
                <p className="text-sm text-gray-500">
                  Start by adding your first plant to begin your care journey
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {plants.map((plant) => {
                  const health = getPlantHealth(plant);
                  const activeTasks = plant.tasks.filter(task => task.active);
                  
                                     return (
                     <SwipeToDeleteCard
                       key={plant.id}
                       ref={(el) => {
                         swipeCardRefs.current[plant.id] = el;
                       }}
                       onDelete={() => openDeleteDialog(plant.id, plant.name)}
                       threshold={100}
                     >
                      <div 
                        className="p-4 cursor-pointer"
                        onClick={() => navigate(`/plants/${plant.id}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {plant.photos && plant.photos.length > 0 ? (
                                <div className="w-10 h-10 rounded-lg overflow-hidden">
                                  <img
                                    src={plant.photos[0].secureUrl}
                                    alt={plant.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl">🌿</span>
                              </div>
                              )}
                              <div className={`absolute -top-1 -right-1 w-3 h-3 ${health.color} rounded-full`}></div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{plant.name}</h4>
                              <p className="text-sm text-gray-600">{plant.type || 'Unknown type'}</p>
                            </div>
                          </div>
                        </div>
                        
                                                 {activeTasks.length > 0 && (
                           <div className="space-y-2">
                             <p className="text-xs font-medium text-gray-700">Active Tasks:</p>
                             <div className="flex flex-wrap gap-2">
                               {(() => {
                                 // Sort tasks by priority: completed first, then by due date (most urgent first)
                                 const sortedTasks = [...activeTasks].sort((a, b) => {
                                   const aCompleted = a.lastCompletedOn !== null;
                                   const bCompleted = b.lastCompletedOn !== null;
                                   
                                   // Completed tasks appear first
                                   if (aCompleted && !bCompleted) return -1;
                                   if (!aCompleted && bCompleted) return 1;
                                   
                                   // If both are completed or both are pending, sort by due date
                                   if (aCompleted === bCompleted) {
                                     const now = new Date();
                                     const aDue = new Date(a.nextDueOn);
                                     const bDue = new Date(b.nextDueOn);
                                     const aDaysUntilDue = Math.ceil((aDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                     const bDaysUntilDue = Math.ceil((bDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                     
                                     // Most urgent (smaller days until due) appears first
                                     return aDaysUntilDue - bDaysUntilDue;
                                   }
                                   
                                   return 0;
                                 });
                                 
                                 return sortedTasks.slice(0, 3).map((task) => {
                                   // Check if task was completed today, not just if it has ever been completed
                                   const now = new Date();
                                   const isCompleted = task.lastCompletedOn ? 
                                     Math.abs(new Date(task.lastCompletedOn).getTime() - now.getTime()) < 24 * 60 * 60 * 1000 : false;
                                   
                                   if (isCompleted) {
                                     return (
                                       <div key={task.id} className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                                         <span className="text-xs">{getTaskIcon(task.taskKey)}</span>
                                         <span className="text-xs text-green-600">Done</span>
                                       </div>
                                     );
                                   } else {
                                     const status = getTaskStatus(task);
                                     return (
                                       <div key={task.id} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                                         <span className="text-xs">{getTaskIcon(task.taskKey)}</span>
                                         <span className={`text-xs ${status.color}`}>{status.text}</span>
                                       </div>
                                     );
                                   }
                                 });
                               })()}
                               {activeTasks.length > 3 && (
                                 <span className="text-xs text-gray-500">+{activeTasks.length - 3} more</span>
                               )}
                             </div>
                           </div>
                         )}
                      </div>
                    </SwipeToDeleteCard>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tasks Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Today's Tasks</h3>
              <button 
                onClick={() => navigate('/calendar')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                View All
              </button>
            </div>
            
            {(() => {
              const todaysTasks = getTodaysTasks();
              
              if (todaysTasks.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">📋</span>
                    </div>
                    <p className="text-gray-600 mb-4">No tasks for today</p>
                    <p className="text-sm text-gray-500">
                      Add plants to start receiving care reminders
                    </p>
                  </div>
                );
              }
              
              return (
                                 <div className="space-y-3 max-h-96 overflow-y-auto">
                   {todaysTasks.slice(0, 5).map(({ task, plant, status, isCompleted }) => (
                     <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                       isCompleted 
                         ? 'bg-green-50 border-green-200' 
                         : 'bg-white border-gray-200'
                     }`}>
                       <div className="flex items-center gap-3">
                         <span className={`text-lg ${isCompleted ? 'opacity-50' : ''}`}>{getTaskIcon(task.taskKey)}</span>
                         <div>
                           <p className={`font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                             {task.taskKey}
                           </p>
                           <p className={`text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                             {plant.name}
                           </p>
                         </div>
                       </div>
                       <div className="flex items-center gap-3">
                         {isCompleted ? (
                           <div className="flex items-center space-x-1 text-green-600">
                             <CheckCircle className="w-4 h-4" />
                             <span className="text-sm">Done</span>
                           </div>
                         ) : (
                           <>
                             <span className={`text-sm font-medium ${status.color}`}>
                               {status.text}
                             </span>
                             <button
                               onClick={() => openConfirmDialog(task, plant)}
                               className="px-3 py-1 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors"
                             >
                               Mark Complete
                             </button>
                           </>
                         )}
                       </div>
                     </div>
                   ))}
                 </div>
              );
            })()}
          </div>

          {/* Overdue Tasks Section */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Overdue Tasks</h3>
              <button 
                onClick={() => navigate('/calendar')}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                View All
              </button>
            </div>
            
            {(() => {
              const overdueTasks = getOverdueTasks();
              
              if (overdueTasks.length === 0) {
                return (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">⚠️</span>
                    </div>
                    <p className="text-gray-600 mb-4">No overdue tasks</p>
                    <p className="text-sm text-gray-500">
                      Great job keeping up with your plant care!
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {overdueTasks.slice(0, 5).map(({ task, plant, status, isCompleted }) => (
                    <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                      isCompleted 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-lg ${isCompleted ? 'opacity-50' : ''}`}>{getTaskIcon(task.taskKey)}</span>
                        <div>
                          <p className={`font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                            {task.taskKey}
                          </p>
                          <p className={`text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                            {plant.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Done</span>
                          </div>
                        ) : (
                          <>
                            <span className={`text-sm font-medium ${status.color}`}>
                              {status.text}
                            </span>
                            <button
                              onClick={() => openConfirmDialog(task, plant)}
                              className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Mark Complete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
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
    </Layout>
  );
};

export default HomePage;

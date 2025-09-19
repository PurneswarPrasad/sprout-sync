import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, Droplets, Sun, Scissors, Zap, Calendar as CalendarIcon, MoreVertical, Leaf } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval as eachMonthDay, setHours, addMonths, subMonths } from 'date-fns';
import { plantsAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { TaskCompletionDialog } from '../components/TaskCompletionDialog';
import { PlantTasksModal } from '../components/PlantTasksModal';

// Helper function to set time to 00:00 for daily tasks
const setTimeToMidnight = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

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

interface CalendarTask {
  id: string;
  plantName: string;
  plantId: string;
  taskKey: string;
  scheduledDate: Date;
  completed: boolean;
  icon: any;
  color: string;
  taskId: string;
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

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    task: CalendarTask | null;
    message: string;
  }>({
    isOpen: false,
    task: null,
    message: '',
  });

  // Plant tasks modal state
  const [plantTasksModal, setPlantTasksModal] = useState<{
    isOpen: boolean;
    plant: Plant | null;
    tasks: CalendarTask[];
  }>({
    isOpen: false,
    plant: null,
    tasks: [],
  });



  useEffect(() => {
    fetchPlants();
  }, []);

  useEffect(() => {
    if (plants.length > 0) {
      generateCalendarTasks();
    }
  }, [plants, currentDate]);

  const fetchPlants = async () => {
    try {
      const response = await plantsAPI.getAll();
      setPlants(response.data.data);
    } catch (error) {
      console.error('Error fetching plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarTasks = () => {
    const calendarTasks: CalendarTask[] = [];
    const today = new Date();

    plants.forEach(plant => {
      plant.tasks.forEach(task => {
        if (task.active) {
          // Generate tasks for the current month and surrounding days
          const monthStart = startOfMonth(currentDate);
          const monthEnd = endOfMonth(currentDate);
          const startDate = subDays(monthStart, 7); // Include some days from previous month
          const endDate = addDays(monthEnd, 7); // Include some days from next month

          // Generate tasks for the extended month range
          for (let i = 0; i < 60; i++) {
            const taskDate = new Date(task.nextDueOn);
            taskDate.setDate(taskDate.getDate() + (i * task.frequencyDays));

            if (taskDate >= startDate && taskDate <= endDate) {
              // Check if this specific task instance was completed
              const isThisTaskCompleted = task.lastCompletedOn ?
                isSameDay(new Date(task.lastCompletedOn), taskDate) : false;

              calendarTasks.push({
                id: `${task.id}-${i}`,
                plantName: getPlantDisplayName(plant),
                plantId: plant.id,
                taskKey: task.taskKey,
                scheduledDate: taskDate,
                completed: isThisTaskCompleted,
                icon: getTaskIcon(task.taskKey),
                color: getTaskColor(task.taskKey),
                taskId: task.id,
              });
            }
          }
        }
      });
    });

    setTasks(calendarTasks);
  };

  const getTaskIcon = (taskKey: string) => {
    switch (taskKey) {
      case 'watering':
        return Droplets;
      case 'fertilizing':
        return Zap;
      case 'pruning':
        return Scissors;
      case 'spraying':
        return Zap;
      case 'sunlightRotation':
        return Sun;
      default:
        return Clock;
    }
  };

  const getTaskColor = (taskKey: string) => {
    switch (taskKey) {
      case 'watering':
        return 'bg-blue-100 text-blue-600';
      case 'fertilizing':
        return 'bg-yellow-100 text-yellow-600';
      case 'pruning':
        return 'bg-green-100 text-green-600';
      case 'spraying':
        return 'bg-purple-100 text-purple-600';
      case 'sunlightRotation':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getTaskDotColor = (taskKey: string) => {
    switch (taskKey) {
      case 'watering':
        return 'bg-blue-500';
      case 'fertilizing':
        return 'bg-yellow-500';
      case 'pruning':
        return 'bg-green-500';
      case 'spraying':
        return 'bg-purple-500';
      case 'sunlightRotation':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'watering':
        return 'Water';
      case 'sunlightRotation':
        return 'Rotate';
      case 'pruning':
        return 'Prune';
      case 'fertilizing':
        return 'Fertilize';
      case 'spraying':
        return 'Spray';
      default:
        return type;
    }
  };

  const getTaskSubtitle = (task: CalendarTask) => {
    // For watering, show "All indoor plants" or specific plant name
    // if (task.taskKey === 'watering') {
    //   return 'All indoor plants';
    // }
    return task.plantName;
  };

  const openConfirmDialog = (task: CalendarTask) => {
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
      task,
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

  // Get month days for calendar grid
  const getMonthDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => isSameDay(task.scheduledDate, date));
  };

  const getPlantPhotosForDate = (date: Date) => {
    const dayTasks = getTasksForDate(date);
    const uniquePlants = new Map();
    
    dayTasks.forEach(task => {
      const plant = plants.find(p => p.id === task.plantId);
      if (plant && plant.photos.length > 0 && !uniquePlants.has(plant.id)) {
        uniquePlants.set(plant.id, plant.photos[0]);
      }
    });
    
    return Array.from(uniquePlants.values()).slice(0, 3); // Show max 3 plant photos
  };

  const isTaskOverdue = (task: CalendarTask) => {
    const today = new Date();
    const taskDate = new Date(task.scheduledDate.getFullYear(), task.scheduledDate.getMonth(), task.scheduledDate.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return taskDate < todayDate && !task.completed;
  };

  const getTasksForSelectedDate = () => {
    const today = new Date();
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    let filteredTasks;
    if (selectedDateOnly < todayOnly) {
      // Past date - show overdue tasks for that date
      filteredTasks = tasks.filter(task => {
        const taskDate = new Date(task.scheduledDate.getFullYear(), task.scheduledDate.getMonth(), task.scheduledDate.getDate());
        return taskDate <= selectedDateOnly && !task.completed;
      }).sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    } else if (selectedDateOnly.getTime() === todayOnly.getTime()) {
      // Today - show today's tasks
      filteredTasks = tasks.filter(task => {
        return isSameDay(task.scheduledDate, today) && !isTaskOverdue(task);
      });
    } else {
      // Future date - show only tasks on that specific date
      filteredTasks = tasks.filter(task => {
        return isSameDay(task.scheduledDate, selectedDate);
      }).sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    }

    // Group tasks by plant
    const groupedTasks = filteredTasks.reduce((groups, task) => {
      const plantId = task.plantId;
      if (!groups[plantId]) {
        groups[plantId] = {
          plant: plants.find(p => p.id === plantId),
          tasks: []
        };
      }
      groups[plantId].tasks.push(task);
      return groups;
    }, {} as Record<string, { plant: Plant | undefined, tasks: CalendarTask[] }>);

    return groupedTasks;
  };

  const getSelectedDateTaskType = () => {
    const today = new Date();
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    if (selectedDateOnly < todayOnly) {
      return 'Overdue Tasks';
    } else if (selectedDateOnly.getTime() === todayOnly.getTime()) {
      return 'Tasks for Today';
    } else {
      return 'Upcoming Tasks';
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const openPlantTasksModal = (plant: Plant, tasks: CalendarTask[]) => {
    setPlantTasksModal({
      isOpen: true,
      plant,
      tasks,
    });
  };

  const closePlantTasksModal = () => {
    setPlantTasksModal({
      isOpen: false,
      plant: null,
      tasks: [],
    });
  };

  const handleTaskClick = (task: CalendarTask) => {
    // Only allow completion for overdue tasks and today's tasks
    const today = new Date();
    const taskDate = new Date(task.scheduledDate.getFullYear(), task.scheduledDate.getMonth(), task.scheduledDate.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isOverdue = taskDate < todayDate && !task.completed;
    const isToday = isSameDay(task.scheduledDate, today);

    if (isOverdue || isToday) {
      openConfirmDialog(task);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your calendar...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const monthDays = getMonthDays();
  const selectedDateGroupedTasks = getTasksForSelectedDate();
  const selectedDateTaskType = getSelectedDateTaskType();

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-4">
          {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Calendar</h1>
          <p className="text-sm text-gray-500 mb-4">Click on any date to view tasks for that day</p>
          
          {/* Month Navigation */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
                <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
            </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const plantPhotos = getPlantPhotosForDate(day);

                return (
                  <button
                    key={day.toString()}
                    onClick={() => handleDateClick(day)}
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : isToday
                        ? 'bg-emerald-100 text-emerald-700'
                        : isCurrentMonth
                        ? 'text-gray-800 hover:bg-gray-100'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {format(day, 'd')}
                    
                    {/* Plant photos */}
                    {plantPhotos.length > 0 && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                        {plantPhotos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo.secureUrl}
                            alt="Plant"
                            className="w-3 h-3 rounded-full object-cover border border-white"
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Date Tasks */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              {selectedDateTaskType} - {format(selectedDate, 'MMM d, yyyy')}
            </h3>
            
            {Object.keys(selectedDateGroupedTasks).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(selectedDateGroupedTasks).map(([plantId, group]) => {
                  const plant = group.plant;
                  const plantTasks = group.tasks;
                  
                  if (!plant) return null;

                  return (
                    <button
                      key={plantId}
                      onClick={() => openPlantTasksModal(plant, plantTasks)}
                      className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-left w-full"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {plant.photos.length > 0 ? (
                            <img
                              src={plant.photos[0].secureUrl}
                              alt={getPlantDisplayName(plant)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Leaf className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 truncate">{getPlantDisplayName(plant)}</h4>
                          <p className="text-sm text-gray-500 truncate">
                            {plant.commonName && plant.petName ? plant.commonName : plant.botanicalName || 'Plant'}
                          </p>
                          <p className="text-xs text-emerald-600 font-medium mt-1">
                            {plantTasks.length} task{plantTasks.length !== 1 ? 's' : ''} scheduled
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No tasks for this date</h3>
                <p className="text-gray-400">Select a different date to view tasks.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Completion Dialog */}
      <TaskCompletionDialog
        isOpen={confirmDialog.isOpen}
        task={confirmDialog.task ? {
          plantName: confirmDialog.task.plantName,
          taskId: confirmDialog.task.taskId,
          plantId: confirmDialog.task.plantId,
        } : null}
        message={confirmDialog.message}
        onClose={closeConfirmDialog}
        onConfirm={markTaskComplete}
        confirmText="Yes, Complete!"
        cancelText="Not yet"
        icon="🌿"
      />

      {/* Plant Tasks Modal */}
      <PlantTasksModal
        isOpen={plantTasksModal.isOpen}
        plant={plantTasksModal.plant}
        tasks={plantTasksModal.tasks}
        onClose={closePlantTasksModal}
        onTaskClick={handleTaskClick}
        getPlantDisplayName={getPlantDisplayName}
        getTaskColor={getTaskColor}
        getTaskTypeLabel={getTaskTypeLabel}
      />
    </Layout>
  );
}
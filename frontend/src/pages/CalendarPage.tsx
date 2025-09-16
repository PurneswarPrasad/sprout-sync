import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, Droplets, Sun, Scissors, Zap } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { plantsAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { TaskCompletionDialog } from '../components/TaskCompletionDialog';
import { DayDetailsModal } from '../components/DayDetailsModal';

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

  // Day details modal state
  const [dayDetailsModal, setDayDetailsModal] = useState<{
    isOpen: boolean;
    selectedDate: Date | null;
    dayTasks: CalendarTask[];
  }>({
    isOpen: false,
    selectedDate: null,
    dayTasks: [],
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
          // Check if task was completed today
          const isCompletedToday = task.lastCompletedOn ? 
            isSameDay(new Date(task.lastCompletedOn), today) : false;
          
          // For daily tasks, only show if not completed today
          if (task.frequencyDays === 1 && !isCompletedToday) {
            // Use the nextDueOn time if it's today, otherwise use midnight
            const scheduledDate = isSameDay(new Date(task.nextDueOn), today) 
              ? new Date(task.nextDueOn) 
              : setTimeToMidnight(today);
            
            calendarTasks.push({
              id: `${task.id}-daily`,
              plantName: getPlantDisplayName(plant),
              plantId: plant.id,
              taskKey: task.taskKey,
              scheduledDate: scheduledDate,
              completed: false,
              icon: getTaskIcon(task.taskKey),
              color: getTaskColor(task.taskKey),
              taskId: task.id,
            });
          }
          
          // Generate tasks for the next 30 days (for all frequencies)
          for (let i = 0; i < 30; i++) {
            const taskDate = new Date(task.nextDueOn);
            taskDate.setDate(taskDate.getDate() + (i * task.frequencyDays));
            
            // Skip today for daily tasks since we already handled them above
            if (task.frequencyDays === 1 && isSameDay(taskDate, today)) {
              continue;
            }
            
            // Only add tasks within the current week view
            const weekStart = startOfWeek(currentDate);
            const weekEnd = endOfWeek(currentDate);
            
            if (taskDate >= weekStart && taskDate <= weekEnd) {
              // Check if this specific task instance was completed
              const isThisTaskCompleted = task.lastCompletedOn ? 
                isSameDay(new Date(task.lastCompletedOn), taskDate) : false;
              
              // Use the actual task date with its time preserved
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
        return 'bg-blue-500';
      case 'fertilizing':
        return 'bg-purple-500';
      case 'pruning':
        return 'bg-green-500';
      case 'spraying':
        return 'bg-yellow-500';
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
      
      // Remove the completed task from today's tasks immediately
      setTasks(prevTasks => 
        prevTasks.filter(task => !(task.taskId === taskId && isSameDay(task.scheduledDate, new Date())))
      );
      
      // Close dialog
      closeConfirmDialog();
      
      // Refresh plants data to ensure consistency
      fetchPlants();
    } catch (error) {
      console.error('Error marking task complete:', error);
    }
  };

  const handleDayClick = (day: Date) => {
    const dayTasks = getTasksForDate(day);
    setDayDetailsModal({
      isOpen: true,
      selectedDate: day,
      dayTasks,
    });
  };

  const closeDayDetailsModal = () => {
    setDayDetailsModal({
      isOpen: false,
      selectedDate: null,
      dayTasks: [],
    });
  };

  const handleTaskCompleteFromModal = async (taskId: string, plantId: string) => {
    try {
      await plantsAPI.completeTask(plantId, taskId);
      
      // Refresh plants data to get updated task status
      await fetchPlants();
      
      // Close the modal
      closeDayDetailsModal();
    } catch (error) {
      console.error('Error marking task complete:', error);
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate),
    end: endOfWeek(currentDate),
  });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => isSameDay(task.scheduledDate, date));
  };

  const isTaskOverdue = (task: CalendarTask) => {
    // Check if this task was originally scheduled before today by looking at the plant's task data
    const plant = plants.find(p => p.id === task.plantId);
    if (!plant) return false;
    
    const plantTask = plant.tasks.find(t => t.id === task.taskId);
    if (!plantTask) return false;
    
    const today = new Date();
    const nextDue = new Date(plantTask.nextDueOn);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const nextDueDate = new Date(nextDue.getFullYear(), nextDue.getMonth(), nextDue.getDate());
    
    // If the original nextDueOn is before today, this task is overdue
    return nextDueDate < todayDate;
  };

  const getOverdueTasks = () => {
    const today = new Date();
    return tasks
      .filter(task => {
        // Set both dates to start of day for accurate comparison
        const taskDate = new Date(task.scheduledDate.getFullYear(), task.scheduledDate.getMonth(), task.scheduledDate.getDate());
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // Include tasks that are overdue (scheduled before today) OR tasks scheduled for today but overdue from earlier dates
        return (taskDate < todayDate || (taskDate.getTime() === todayDate.getTime() && isTaskOverdue(task))) && !task.completed;
      })
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
      .slice(0, 5);
  };

  const getTodaysTasks = () => {
    return tasks.filter(task => {
      // Include tasks that are scheduled for today AND are not overdue from earlier dates
      return isSameDay(task.scheduledDate, new Date()) && !isTaskOverdue(task);
    });
  };

  const getUpcomingTasks = () => {
    return tasks
      .filter(task => task.scheduledDate > new Date())
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
      .slice(0, 5);
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Calendar</h1>
            <p className="text-sm sm:text-base text-gray-600">Track your plant care schedule</p>
          </div>
          <div className="flex items-center justify-center sm:justify-end space-x-2">
            <button
              onClick={() => setCurrentDate(subDays(currentDate, 7))}
              className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-emerald-600" />
            </button>
            <span className="font-medium text-gray-800 text-sm sm:text-base">
              {format(currentDate, 'MMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Week View */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekDays.map((day) => {
              const dayTasks = getTasksForDate(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toString()}
                  className={`min-h-20 sm:min-h-24 p-1 sm:p-2 rounded-lg border cursor-pointer transition-colors ${
                    isToday
                      ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isToday ? 'text-gray-800' : 'text-gray-600'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {(() => {
                      const dayTasks = getTasksForDate(day);
                      const visibleTasks = dayTasks.slice(0, 3);
                      const remainingCount = dayTasks.length - 3;
                      
                      return (
                        <>
                          {visibleTasks.map((task) => {
                            const Icon = task.icon;
                            // Check if task is overdue - only show red if it's actually overdue
                            const today = new Date();
                            const taskDate = new Date(task.scheduledDate.getFullYear(), task.scheduledDate.getMonth(), task.scheduledDate.getDate());
                            const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                            const isOverdue = (taskDate < todayDate || (taskDate.getTime() === todayDate.getTime() && isTaskOverdue(task))) && !task.completed;
                            
                            return (
                              <div
                                key={task.id}
                                className={`flex items-center space-x-1 p-1 rounded text-xs ${
                                  task.completed
                                    ? 'bg-green-100 text-green-700'
                                    : isOverdue
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                                title={`${task.plantName} - ${getTaskTypeLabel(task.taskKey)}`}
                              >
                                <Icon className="w-3 h-3" />
                                <span className="truncate" title={`${task.plantName} - ${getTaskTypeLabel(task.taskKey)}`}>{getTaskTypeLabel(task.taskKey)}</span>
                              </div>
                            );
                          })}
                          
                          {remainingCount > 0 && (
                            <div className="text-xs text-gray-500 text-center py-1">
                              +{remainingCount}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overdue Tasks */}
        {getOverdueTasks().length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-red-600">Overdue Tasks</h2>
            
            <div className="space-y-3">
              {getOverdueTasks().map((task) => {
                const Icon = task.icon;
                return (
                  <div key={task.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-lg border border-red-200">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${task.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-800 truncate text-sm sm:text-base" title={task.plantName}>{task.plantName}</h3>
                          <p className="text-xs sm:text-sm text-red-600 truncate">
                            {getTaskTypeLabel(task.taskKey)} • {format(task.scheduledDate, 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center flex-shrink-0">
                        <button
                          onClick={() => openConfirmDialog(task)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
                        >
                          <Clock className="w-4 h-4" />
                          <span className="text-xs sm:text-sm hidden sm:inline">Mark Complete</span>
                          <span className="text-xs sm:text-sm sm:hidden">Complete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's Tasks */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Today's Tasks</h2>
          
          {getTodaysTasks().length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <p className="text-gray-600 mb-2">No tasks for today</p>
              <p className="text-sm text-gray-500">Enjoy your day off from plant care!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getTodaysTasks().map((task) => {
                const Icon = task.icon;
                return (
                  <div key={task.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-lg border border-white/20">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 ${task.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-800 truncate text-sm sm:text-base" title={task.plantName}>{task.plantName}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {getTaskTypeLabel(task.taskKey)} • {format(task.scheduledDate, 'h:mm a')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center flex-shrink-0">
                        {task.completed ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs sm:text-sm">Done</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => openConfirmDialog(task)}
                            className="flex items-center space-x-1 text-yellow-600 hover:text-yellow-700 transition-colors"
                          >
                            <Clock className="w-4 h-4" />
                            <span className="text-xs sm:text-sm hidden sm:inline">Mark Complete</span>
                            <span className="text-xs sm:text-sm sm:hidden">Complete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Upcoming</h2>
          
          {getUpcomingTasks().length === 0 ? (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📅</span>
              </div>
              <p className="text-gray-600 mb-2">No upcoming tasks</p>
              <p className="text-sm text-gray-500">All caught up with your plant care!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getUpcomingTasks().map((task) => {
                const Icon = task.icon;
                return (
                  <div key={task.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-lg border border-white/20">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className={`w-8 h-8 ${task.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate text-sm sm:text-base" title={task.plantName}>{task.plantName}</h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {getTaskTypeLabel(task.taskKey)} • {format(task.scheduledDate, 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

      {/* Day Details Modal */}
      <DayDetailsModal
        isOpen={dayDetailsModal.isOpen}
        onClose={closeDayDetailsModal}
        selectedDate={dayDetailsModal.selectedDate}
        dayTasks={dayDetailsModal.dayTasks}
        onTaskComplete={handleTaskCompleteFromModal}
      />
    </Layout>
  );
}
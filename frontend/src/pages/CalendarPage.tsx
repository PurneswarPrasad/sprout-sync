import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, Droplets, Sun, Scissors, Zap, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval as eachMonthDay, setHours } from 'date-fns';
import { plantsAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { TaskCompletionDialog } from '../components/TaskCompletionDialog';

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


  // Overlapping tasks modal state
  const [overlappingTasksModal, setOverlappingTasksModal] = useState<{
    isOpen: boolean;
    selectedTime: Date | null;
    overlappingTasks: CalendarTask[];
  }>({
    isOpen: false,
    selectedTime: null,
    overlappingTasks: [],
  });

  // Swipe gesture state
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeStartY, setSwipeStartY] = useState<number | null>(null);
  


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

  const closeOverlappingTasksModal = () => {
    setOverlappingTasksModal({
      isOpen: false,
      selectedTime: null,
      overlappingTasks: [],
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

  const handleTaskClick = (task: CalendarTask, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Check if there are overlapping tasks at the same exact time
    if (hasOverlappingTasks(task.scheduledDate, task.scheduledDate)) {
      const overlappingTasks = getTasksAtExactTime(task.scheduledDate, task.scheduledDate);
      setOverlappingTasksModal({
        isOpen: true,
        selectedTime: task.scheduledDate,
        overlappingTasks,
      });
      return;
    }
    
    // Only allow completion for overdue tasks and today's tasks
    const today = new Date();
    const taskDate = new Date(task.scheduledDate.getFullYear(), task.scheduledDate.getMonth(), task.scheduledDate.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isOverdue = (taskDate < todayDate || (taskDate.getTime() === todayDate.getTime() && isTaskOverdue(task))) && !task.completed;
    const isToday = isSameDay(task.scheduledDate, today);
    
    if (isOverdue || isToday) {
      openConfirmDialog(task);
    }
  };

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate),
    end: endOfWeek(currentDate),
  });

  // Get month days for mini calendar
  const monthDays = eachMonthDay({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => isSameDay(task.scheduledDate, date));
  };

  // Generate time slots from 0 to 23 (24-hour timeline)
  const generateTimeSlots = () => {
    const timeSlots = [];
    for (let hour = 0; hour <= 23; hour++) {
      timeSlots.push(hour);
    }
    return timeSlots;
  };

  // Get tasks for a specific day and hour
  const getTasksForDayAndHour = (date: Date, hour: number) => {
    return tasks.filter(task => {
      if (!isSameDay(task.scheduledDate, date)) return false;
      const taskHour = task.scheduledDate.getHours();
      return taskHour === hour;
    });
  };

  // Calculate task position and height based on time
  const getTaskPosition = (task: CalendarTask) => {
    const hour = task.scheduledDate.getHours();
    const minutes = task.scheduledDate.getMinutes();
    
    // Calculate top position (each hour is 64px, each minute is ~1px)
    const topPosition = hour * 64 + (minutes * 64 / 60);
    
    // Default height for tasks (32px)
    const height = 32;
    
    return { top: topPosition, height };
  };

  // Get tasks at the exact same time
  const getTasksAtExactTime = (date: Date, time: Date) => {
    return tasks.filter(task => {
      if (!isSameDay(task.scheduledDate, date)) return false;
      return task.scheduledDate.getHours() === time.getHours() && 
             task.scheduledDate.getMinutes() === time.getMinutes();
    });
  };

  // Check if there are multiple tasks at the same exact time
  const hasOverlappingTasks = (date: Date, time: Date) => {
    return getTasksAtExactTime(date, time).length > 1;
  };


  // Handle swipe gestures for week navigation
  const handleSwipeStart = (event: React.TouchEvent) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      setSwipeStartX(touch.clientX);
      setSwipeStartY(touch.clientY);
    }
  };

  const handleSwipeMove = (event: React.TouchEvent) => {
    // No need to prevent default - let the browser handle scrolling naturally
  };

  const handleSwipeEnd = (event: React.TouchEvent) => {
    if (event.changedTouches.length === 1 && swipeStartX !== null && swipeStartY !== null) {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - swipeStartX;
      const deltaY = touch.clientY - swipeStartY;
      
      // Only process horizontal swipes (ignore vertical swipes for calendar expansion)
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // Minimum swipe distance and ensure it's more horizontal than vertical
      if (absDeltaX > 50 && absDeltaX > absDeltaY * 2) {
        if (deltaX > 0) {
          // Swipe right - go to previous week
          setCurrentDate(subDays(currentDate, 7));
        } else {
          // Swipe left - go to next week
          setCurrentDate(addDays(currentDate, 7));
        }
      }
    }
    
    // Reset swipe state
    setSwipeStartX(null);
    setSwipeStartY(null);
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
      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-col lg:flex-row gap-4 h-full">
        {/* Left Sidebar - Mini Calendar */}
        <div className="w-full lg:w-80 bg-white/70 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-lg border border-white/20 order-2 lg:order-1">
        {/* Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              Calendar
            </h1>
          </div>

          {/* Mini Calendar */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-sm sm:text-lg font-semibold text-gray-800">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentDate(subDays(currentDate, 30))}
                  className="p-1 hover:bg-emerald-100 rounded transition-colors"
                >
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                </button>
                <button
                  onClick={() => setCurrentDate(addDays(currentDate, 30))}
                  className="p-1 hover:bg-emerald-100 rounded transition-colors"
                >
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                </button>
              </div>
            </div>
            
            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                const isCurrentWeek = weekDays.some(weekDay => isSameDay(weekDay, day));
                const hasTasks = getTasksForDate(day).length > 0;
                
                return (
                  <button
                    key={day.toString()}
                    onClick={() => setCurrentDate(day)}
                    className={`w-6 h-6 sm:w-8 sm:h-8 text-xs rounded transition-colors ${
                      isToday
                        ? 'bg-emerald-600 text-white font-semibold'
                        : isCurrentWeek
                        ? 'bg-emerald-100 text-emerald-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="relative">
                      {format(day, 'd')}
                      {hasTasks && (
                        <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                          isToday ? 'bg-white' : 'bg-emerald-600'
                        }`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentDate(subDays(currentDate, 7))}
              className="p-1.5 sm:p-2 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
            </button>
            <span className="font-medium text-gray-800 text-xs sm:text-sm">
              {format(startOfWeek(currentDate), 'MMM d')} - {format(endOfWeek(currentDate), 'MMM d')}
            </span>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="p-1.5 sm:p-2 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Main Calendar View - Desktop */}
        <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-lg border border-white/20 order-1 lg:order-2">
          {/* Week Header */}
          <div className="grid grid-cols-7 gap-1 mb-2 sm:mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-600 py-1 sm:py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Week Grid */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const dayTasks = getTasksForDate(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toString()}
                  className={`min-h-24 sm:min-h-32 p-1 sm:p-2 rounded-lg border cursor-pointer transition-colors ${
                    isToday
                      ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
                    isToday ? 'text-gray-800' : 'text-gray-600'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-0.5 sm:space-y-1">
                    {dayTasks.map((task) => {
                            const Icon = task.icon;
                            const today = new Date();
                            const taskDate = new Date(task.scheduledDate.getFullYear(), task.scheduledDate.getMonth(), task.scheduledDate.getDate());
                            const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                            const isOverdue = (taskDate < todayDate || (taskDate.getTime() === todayDate.getTime() && isTaskOverdue(task))) && !task.completed;
                      const isTaskToday = isSameDay(task.scheduledDate, today);
                            
                            return (
                              <div
                                key={task.id}
                          onClick={(e) => handleTaskClick(task, e)}
                          className={`flex items-center space-x-0.5 sm:space-x-1 p-0.5 sm:p-1 rounded text-xs cursor-pointer transition-colors ${
                                  task.completed
                                    ? 'bg-green-100 text-green-700'
                                    : isOverdue
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : isTaskToday
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          } ${(isOverdue || isTaskToday) && !task.completed ? 'cursor-pointer' : 'cursor-default'}`}
                          title={`${task.plantName} - ${getTaskTypeLabel(task.taskKey)}${(isOverdue || isTaskToday) && !task.completed ? ' (Click to complete)' : ''}`}
                        >
                          <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                          <span className="truncate flex-1 text-xs" title={`${task.plantName} - ${getTaskTypeLabel(task.taskKey)}`}>
                            <span className="hidden sm:inline">{getTaskTypeLabel(task.taskKey)}</span>
                            <span className="sm:hidden">{getTaskTypeLabel(task.taskKey).charAt(0)}</span>
                          </span>
                          {task.completed && (
                            <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
                        </div>
                      </div>
                      

      {/* Mobile Time Grid View */}
      <div 
        className="block lg:hidden bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20 relative"
        onTouchStart={handleSwipeStart}
        onTouchMove={handleSwipeMove}
        onTouchEnd={handleSwipeEnd}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(subDays(currentDate, 7))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="font-medium text-gray-800 text-sm">
              {format(startOfWeek(currentDate), 'MMM d')} - {format(endOfWeek(currentDate), 'MMM d')}
            </span>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {format(new Date(), 'd')}
                        </div>
                        </div>
                      </div>
                      
        {/* Week Header */}
        <div className="flex mb-2">
          <div className="w-16 text-xs font-medium text-gray-500 py-2"></div>
          <div className="flex-1 grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toString()} className="text-center">
                  <div className="text-xs font-medium text-gray-500 py-1">
                    {format(day, 'EEE')}
                          </div>
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium ${
                    isToday
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {format(day, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>
        </div>

        {/* Time Grid */}
        <div className="flex">
          {/* Time Column */}
          <div className="w-16">
            {generateTimeSlots().map((hour) => (
              <div key={hour} className="h-16 border-b border-gray-200 py-1">
                <div className="text-xs text-gray-500 text-right pr-2">
                  {format(setHours(new Date(), hour), 'HH:mm')}
                </div>
              </div>
            ))}
            </div>
          
          {/* Calendar Grid */}
          <div className="flex-1 grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div key={day.toString()} className="relative border-r border-gray-200">
                {/* Hour lines */}
                  {generateTimeSlots().map((hour) => (
                    <div key={hour} className="h-16 border-b border-gray-100 relative">
                    {/* Tasks for this hour */}
                    {getTasksForDayAndHour(day, hour).map((task, index) => {
                const Icon = task.icon;
                      const today = new Date();
                      const taskDate = new Date(task.scheduledDate.getFullYear(), task.scheduledDate.getMonth(), task.scheduledDate.getDate());
                      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      const isOverdue = (taskDate < todayDate || (taskDate.getTime() === todayDate.getTime() && isTaskOverdue(task))) && !task.completed;
                      const isTaskToday = isSameDay(task.scheduledDate, today);
                      const position = getTaskPosition(task);
                      const hasOverlapping = hasOverlappingTasks(day, task.scheduledDate);
                      
                      // Stack overlapping tasks vertically
                      const stackedOffset = hasOverlapping ? index * 36 : 0;
                      
                return (
                        <div
                          key={task.id}
                          onClick={(e) => handleTaskClick(task, e)}
                          className={`absolute left-1 right-1 rounded px-2 py-1 text-xs cursor-pointer transition-colors ${
                            task.completed
                              ? 'bg-green-100 text-green-700 border-l-2 border-green-500'
                              : isOverdue
                              ? 'bg-red-100 text-red-700 border-l-2 border-red-500 hover:bg-red-200'
                              : isTaskToday
                              ? 'bg-yellow-100 text-yellow-700 border-l-2 border-yellow-500 hover:bg-yellow-200'
                              : 'bg-blue-100 text-blue-700 border-l-2 border-blue-500 hover:bg-blue-200'
                          } ${(isOverdue || isTaskToday) && !task.completed ? 'cursor-pointer' : 'cursor-default'}`}
                          style={{ 
                            top: `${position.top + stackedOffset}px`, 
                            height: `${position.height}px`,
                            zIndex: hasOverlapping ? 10 + index : 1
                          }}
                          title={`${task.plantName} - ${getTaskTypeLabel(task.taskKey)}${hasOverlapping ? ' (Multiple tasks at this time - click to see all)' : (isOverdue || isTaskToday) && !task.completed ? ' (Click to complete)' : ''}`}
                        >
                          <div className="flex items-center gap-1">
                            <Icon className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate flex-1 font-medium">
                              {getTaskTypeLabel(task.taskKey)}
                              {hasOverlapping && (
                                <span className="ml-1 text-xs opacity-75">
                                  ({getTasksAtExactTime(day, task.scheduledDate).length})
                                </span>
                              )}
                            </span>
                            {task.completed && (
                              <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                            )}
                      </div>
                          <div className="text-xs opacity-75 truncate">
                            {task.plantName}
                    </div>
                  </div>
                );
              })}
            </div>
                ))}
              </div>
            ))}
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

      {/* Overlapping Tasks Modal */}
      {overlappingTasksModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Tasks at {overlappingTasksModal.selectedTime ? format(overlappingTasksModal.selectedTime, 'h:mm a') : ''}
              </h3>
              <button
                onClick={closeOverlappingTasksModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              {overlappingTasksModal.overlappingTasks.map((task) => {
                const Icon = task.icon;
                const today = new Date();
                const taskDate = new Date(task.scheduledDate.getFullYear(), task.scheduledDate.getMonth(), task.scheduledDate.getDate());
                const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const isOverdue = (taskDate < todayDate || (taskDate.getTime() === todayDate.getTime() && isTaskOverdue(task))) && !task.completed;
                const isTaskToday = isSameDay(task.scheduledDate, today);
                
                return (
                  <div key={task.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 ${task.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{task.plantName}</h4>
                          <p className="text-sm text-gray-600">{getTaskTypeLabel(task.taskKey)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        {task.completed ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Done</span>
                          </div>
                        ) : (isOverdue || isTaskToday) ? (
                          <button
                            onClick={() => {
                              closeOverlappingTasksModal();
                              openConfirmDialog(task);
                            }}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                              isOverdue
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }`}
                          >
                            <Clock className="w-4 h-4" />
                            <span>Complete</span>
                          </button>
                        ) : (
                          <span className="text-sm text-gray-500">Future</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
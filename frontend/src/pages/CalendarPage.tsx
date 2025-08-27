import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Clock, Droplets, Sun, Scissors, Zap } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import axios from 'axios';
import { Layout } from '../components/Layout';

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
  _count: {
    notes: number;
    photos: number;
  };
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

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<CalendarTask[]>([]);

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
      const response = await axios.get('http://localhost:3001/api/plants', {
        withCredentials: true,
      });
      setPlants(response.data.data);
    } catch (error) {
      console.error('Error fetching plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarTasks = () => {
    const calendarTasks: CalendarTask[] = [];
    
    plants.forEach(plant => {
      plant.tasks.forEach(task => {
        if (task.active) {
          // Generate tasks for the next 30 days
          for (let i = 0; i < 30; i++) {
            const taskDate = new Date(task.nextDueOn);
            taskDate.setDate(taskDate.getDate() + (i * task.frequencyDays));
            
            // Only add tasks within the current week view
            const weekStart = startOfWeek(currentDate);
            const weekEnd = endOfWeek(currentDate);
            
            if (taskDate >= weekStart && taskDate <= weekEnd) {
              calendarTasks.push({
                id: `${task.id}-${i}`,
                plantName: plant.name,
                plantId: plant.id,
                taskKey: task.taskKey,
                scheduledDate: taskDate,
                completed: task.lastCompletedOn ? 
                  new Date(task.lastCompletedOn) >= taskDate : false,
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

  const markTaskComplete = async (taskId: string, plantId: string) => {
    try {
      await axios.patch(`http://localhost:3001/api/plants/${plantId}/tasks/${taskId}/complete`, {}, {
        withCredentials: true,
      });
      // Refresh plants data
      fetchPlants();
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

  const getTodaysTasks = () => {
    return tasks.filter(task => isSameDay(task.scheduledDate, new Date()));
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
            <p className="text-gray-600">Track your plant care schedule</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentDate(subDays(currentDate, 7))}
              className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-emerald-600" />
            </button>
            <span className="font-medium text-gray-800">
              {format(currentDate, 'MMMM yyyy')}
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
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayTasks = getTasksForDate(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toString()}
                  className={`min-h-24 p-2 rounded-lg border ${
                    isToday
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isToday ? 'text-gray-800' : 'text-gray-600'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayTasks.map((task) => {
                      const Icon = task.icon;
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center space-x-1 p-1 rounded text-xs cursor-pointer ${
                            task.completed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                          onClick={() => !task.completed && markTaskComplete(task.taskId, task.plantId)}
                          title={`${task.plantName} - ${getTaskTypeLabel(task.taskKey)}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span className="truncate">{getTaskTypeLabel(task.taskKey)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
                  <div key={task.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${task.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">{task.plantName}</h3>
                          <p className="text-sm text-gray-600">
                            {getTaskTypeLabel(task.taskKey)} • {format(task.scheduledDate, 'h:mm a')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {task.completed ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Done</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => markTaskComplete(task.taskId, task.plantId)}
                            className="flex items-center space-x-1 text-yellow-600 hover:text-yellow-700 transition-colors"
                          >
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Mark Complete</span>
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
                  <div key={task.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 ${task.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{task.plantName}</h3>
                        <p className="text-sm text-gray-600">
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
    </Layout>
  );
}
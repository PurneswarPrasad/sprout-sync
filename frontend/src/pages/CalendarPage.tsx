import { ChevronLeft, ChevronRight, CheckCircle, Clock, Droplets, Sun, Scissors, Zap } from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { useState } from 'react';
import { Layout } from '../components/Layout';

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const tasks = [
    {
      id: 1,
      plantName: 'Monstera Deliciosa',
      taskType: 'watering',
      scheduledDate: new Date(),
      completed: false,
      icon: Droplets,
      color: 'bg-blue-500',
    },
    {
      id: 2,
      plantName: 'Snake Plant',
      taskType: 'sunlight-rotation',
      scheduledDate: new Date(),
      completed: false,
      icon: Sun,
      color: 'bg-yellow-500',
    },
    {
      id: 3,
      plantName: 'Pothos',
      taskType: 'pruning',
      scheduledDate: addDays(new Date(), 1),
      completed: false,
      icon: Scissors,
      color: 'bg-green-500',
    },
    {
      id: 4,
      plantName: 'Aloe Vera',
      taskType: 'fertilizing',
      scheduledDate: addDays(new Date(), 2),
      completed: false,
      icon: Zap,
      color: 'bg-purple-500',
    },
  ];

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate),
    end: endOfWeek(currentDate),
  });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(
      (task) => format(task.scheduledDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'watering':
        return 'Water';
      case 'sunlight-rotation':
        return 'Rotate';
      case 'pruning':
        return 'Prune';
      case 'fertilizing':
        return 'Fertilize';
      default:
        return type;
    }
  };

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
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
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
                          className={`flex items-center space-x-1 p-1 rounded text-xs ${
                            task.completed
                              ? 'bg-green-100 text-green-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span className="truncate">{getTaskTypeLabel(task.taskType)}</span>
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
          
          <div className="space-y-3">
            {tasks
              .filter((task) => format(task.scheduledDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
              .map((task) => {
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
                            {getTaskTypeLabel(task.taskType)} • {format(task.scheduledDate, 'h:mm a')}
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
                          <div className="flex items-center space-x-1 text-yellow-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Upcoming</h2>
          
          <div className="space-y-3">
            {tasks
              .filter((task) => task.scheduledDate > new Date())
              .slice(0, 3)
              .map((task) => {
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
                          {getTaskTypeLabel(task.taskType)} • {format(task.scheduledDate, 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </Layout>
  );
}


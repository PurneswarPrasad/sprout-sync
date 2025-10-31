import React from 'react';
import { CheckCircle } from 'lucide-react';

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
  photos: any[];
  _count: {
    notes: number;
    photos: number;
  };
}

interface TaskItem {
  task: PlantTask;
  plant: Plant;
  status: { status: string; text: string; color: string };
  isCompleted: boolean;
}

interface OverdueSectionProps {
  tasks: TaskItem[];
  onViewAll: () => void;
  onTaskComplete: (task: PlantTask, plant: Plant) => void;
  getTaskIcon: (taskKey: string) => string;
  getTaskDisplayName: (taskKey: string) => string;
  getPlantDisplayName: (plant: Plant) => string;
}

export const OverdueSection: React.FC<OverdueSectionProps> = ({
  tasks,
  onViewAll,
  onTaskComplete,
  getTaskIcon,
  getTaskDisplayName,
  getPlantDisplayName,
}) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Overdue Tasks</h3>
        <button 
          onClick={onViewAll}
          className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm sm:text-base"
        >
          View All
        </button>
      </div>
      
      {tasks.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl sm:text-3xl">⚠️</span>
          </div>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">No overdue tasks</p>
          <p className="text-xs sm:text-sm text-gray-500">
            Great job keeping up with your plant care!
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
          {tasks.slice(0, 5).map(({ task, plant, status, isCompleted }) => (
            <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border ${
              isCompleted 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={`text-base sm:text-lg ${isCompleted ? 'opacity-50' : ''}`}>{getTaskIcon(task.taskKey)}</span>
                <div className="min-w-0 flex-1">
                  <p className={`font-medium text-sm sm:text-base ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'} truncate`}>
                    {getTaskDisplayName(task.taskKey)}
                  </p>
                  <p className={`text-xs sm:text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-600'} truncate`}>
                    {getPlantDisplayName(plant)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                {isCompleted ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Done</span>
                  </div>
                ) : (
                  <>
                    <span className={`text-xs sm:text-sm font-medium ${status.color} hidden sm:block`}>
                      {status.text}
                    </span>
                    <button
                      onClick={() => onTaskComplete(task, plant)}
                      className="px-2 sm:px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Complete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Clock, Leaf } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

interface PlantTask {
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
  tasks: any[];
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

interface PlantTasksModalProps {
  isOpen: boolean;
  plant: Plant | null;
  tasks: PlantTask[];
  onClose: () => void;
  onTaskClick: (task: PlantTask) => void;
  getPlantDisplayName: (plant: Plant) => string;
  getTaskColor: (taskKey: string) => string;
  getTaskTypeLabel: (type: string) => string;
}

export const PlantTasksModal: React.FC<PlantTasksModalProps> = ({
  isOpen,
  plant,
  tasks,
  onClose,
  onTaskClick,
  getPlantDisplayName,
  getTaskColor,
  getTaskTypeLabel,
}) => {
  if (!isOpen || !plant) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
              {plant.photos.length > 0 ? (
                <img
                  src={plant.photos[0].secureUrl}
                  alt={getPlantDisplayName(plant)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {getPlantDisplayName(plant)}
              </h3>
              <p className="text-sm text-gray-500">
                {plant.commonName && plant.petName 
                  ? plant.commonName 
                  : plant.botanicalName || 'Plant'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => {
            const Icon = task.icon;
            const today = new Date();
            const taskDate = new Date(task.scheduledDate.getFullYear(), task.scheduledDate.getMonth(), task.scheduledDate.getDate());
            const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isOverdue = taskDate < todayDate && !task.completed;
            const isToday = isSameDay(task.scheduledDate, today);
            const canComplete = isOverdue || isToday;

            return (
              <div key={task.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${getTaskColor(task.taskKey)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{getTaskTypeLabel(task.taskKey)}</h4>
                      {!isToday && (
                        <p className="text-xs text-gray-400">
                          {format(task.scheduledDate, 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    {canComplete ? (
                      <button
                        onClick={() => {
                          onClose();
                          onTaskClick(task);
                        }}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                          isOverdue
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
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
  );
};

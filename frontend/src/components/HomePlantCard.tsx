import React from 'react';
import { SwipeToDeleteCard, SwipeToDeleteCardRef } from './SwipeToDeleteCard';

interface PlantPhoto {
  id: string;
  plantId: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  takenAt: string;
  pointsAwarded: number;
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

interface HomePlantCardProps {
  plant: Plant;
  onPlantClick: (plantId: string) => void;
  onDelete: (plantId: string, plantName: string) => void;
  getPlantDisplayName: (plant: Plant) => string;
  getPlantHealth: (plant: Plant) => { status: string; color: string };
  getTaskIcon: (taskKey: string) => string;
  getTaskStatus: (task: PlantTask) => { status: string; text: string; color: string };
  swipeCardRef: React.RefObject<SwipeToDeleteCardRef>;
}

export const HomePlantCard: React.FC<HomePlantCardProps> = ({
  plant,
  onPlantClick,
  onDelete,
  getPlantDisplayName,
  getPlantHealth,
  getTaskIcon,
  getTaskStatus,
  swipeCardRef,
}) => {
  const health = getPlantHealth(plant);
  const activeTasks = plant.tasks.filter(task => task.active);

  return (
    <SwipeToDeleteCard
      ref={swipeCardRef}
      onDelete={() => onDelete(plant.id, getPlantDisplayName(plant))}
      threshold={100}
    >
      <div 
        className="p-3 sm:p-4 cursor-pointer"
        onClick={() => onPlantClick(plant.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              {plant.photos && plant.photos.length > 0 ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden">
                  <img
                    src={plant.photos[0].secureUrl}
                    alt={getPlantDisplayName(plant)}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg sm:text-xl">🌿</span>
                </div>
              )}
              <div className={`absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 ${health.color} rounded-full`}></div>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{getPlantDisplayName(plant)}</h4>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{plant.type || 'Unknown type'}</p>
            </div>
          </div>
        </div>
        
        {activeTasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Active Tasks:</p>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {(() => {
                // Sort tasks by due date (most urgent first)
                const sortedTasks = [...activeTasks].sort((a, b) => {
                  const now = new Date();
                  const aDue = new Date(a.nextDueOn);
                  const bDue = new Date(b.nextDueOn);
                  const aDaysUntilDue = Math.ceil((aDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  const bDaysUntilDue = Math.ceil((bDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  
                  // Most urgent (smaller days until due) appears first
                  return aDaysUntilDue - bDaysUntilDue;
                });
                
                return sortedTasks.slice(0, 2).map((task) => {
                  // Check if task was completed today, not just if it has ever been completed
                  const now = new Date();
                  const isCompleted = false; // Removed: lastCompletedOn tracking
                  
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
              {activeTasks.length > 2 && (
                <span className="text-xs text-gray-500">+{activeTasks.length - 2} more</span>
              )}
            </div>
          </div>
        )}
      </div>
    </SwipeToDeleteCard>
  );
};

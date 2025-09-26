import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, X } from 'lucide-react';

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
  lastCompletedOn: string | null;
  active: boolean;
}

interface PlantTag {
  tag: {
    id: string;
    name: string;
    colorHex: string | null;
  };
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
  tags: PlantTag[];
  photos: PlantPhoto[];
  _count: {
    notes: number;
    photos: number;
  };
}

interface PlantCardProps {
  plant: Plant;
  onDelete: (plantId: string, plantName: string) => void;
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

const getTaskStatus = (task: PlantTask) => {
  const now = new Date();
  const nextDue = new Date(task.nextDueOn);
  const daysUntilDue = Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Check if task was completed today
  const isCompletedToday = task.lastCompletedOn ?
    Math.abs(new Date(task.lastCompletedOn).getTime() - now.getTime()) < 24 * 60 * 60 * 1000 : false;

  // If task is due today and was completed today, show "Done"
  if ((daysUntilDue === 0 || task.frequencyDays === 1) && isCompletedToday) {
    return { status: 'completed', text: 'Done', color: 'text-green-600' };
  }

  // For daily tasks (frequency=1), always show "Due today" if not completed today
  if (task.frequencyDays === 1) {
    return { status: 'due-today', text: 'Due today', color: 'text-blue-600' };
  }

  if (daysUntilDue < 0) {
    return { status: 'overdue', text: 'Overdue', color: 'text-red-600' };
  } else if (daysUntilDue === 0) {
    return { status: 'due-today', text: 'Due today', color: 'text-blue-600' };
  } else if (daysUntilDue === 1) {
    return { status: 'due-tomorrow', text: 'Due tomorrow', color: 'text-yellow-600' };
  } else if (daysUntilDue <= 2) {
    return { status: 'due-soon', text: `Due in ${daysUntilDue} days`, color: 'text-yellow-600' };
  } else {
    return { status: 'upcoming', text: `Due in ${daysUntilDue} days`, color: 'text-gray-600' };
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

export function PlantCard({ plant, onDelete }: PlantCardProps) {
  const navigate = useNavigate();
  const health = getPlantHealth(plant);
  const activeTasks = plant.tasks.filter(task => task.active);

  return (
    <div
      className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20 hover:scale-105 transition-transform duration-200 cursor-pointer"
      onClick={() => navigate(`/plants/${plant.id}`)}
    >
      <div className="relative mb-3">
        {plant.photos && plant.photos.length > 0 ? (
          <div className="w-full rounded-lg overflow-hidden">
            <img
              src={plant.photos[0].secureUrl}
              alt={getPlantDisplayName(plant)}
              className="w-full h-auto max-h-32 object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-32 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Leaf className="w-8 h-8 text-emerald-400" />
          </div>
        )}
        <div className={`absolute top-2 right-2 w-3 h-3 ${health.color} rounded-full`}></div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(plant.id, getPlantDisplayName(plant));
          }}
          className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-red-50 hover:text-red-600 transition-colors text-gray-500"
          title="Delete plant"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-gray-800 truncate" title={getPlantDisplayName(plant)}>
            {getPlantDisplayName(plant)}
          </h3>
          <p className="text-sm text-gray-600 truncate" title={plant.type || 'Unknown type'}>
            {plant.type || 'Unknown type'}
          </p>
        </div>

        {/* Tasks */}
        {activeTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Active Tasks</h4>
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
              <p className="text-xs text-gray-500">+{activeTasks.length - 3} more tasks</p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <span>{plant._count.notes} notes</span>
            <span>{plant._count.photos} photos</span>
          </div>
          <button
            onClick={() => navigate(`/plants/${plant.id}`)}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
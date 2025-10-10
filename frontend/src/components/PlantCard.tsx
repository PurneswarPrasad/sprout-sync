import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Leaf, X } from 'lucide-react';

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
  isGifted?: boolean;
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
      className="relative flex h-full flex-col rounded-2xl border border-white/20 bg-white/70 p-3 shadow-md transition hover:-translate-y-1 hover:shadow-lg cursor-pointer"
      onClick={() => navigate(`/plants/${plant.id}`)}
    >
      <div className="relative mb-3">
        {plant.photos && plant.photos.length > 0 ? (
          <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-white">
            <img
              src={plant.photos[0].secureUrl}
              alt={getPlantDisplayName(plant)}
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-emerald-100/80">
            <Leaf className="h-8 w-8 text-emerald-400" />
          </div>
        )}
        <div className={`absolute right-2 top-2 h-3 w-3 rounded-full ${health.color}`}></div>

        {plant.isGifted && (
          <div className="absolute left-1/2 top-2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 shadow-sm">
            <Gift className="h-3 w-3" />
            Gifted
          </div>
        )}

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(plant.id, getPlantDisplayName(plant));
          }}
          className="absolute left-2 top-2 rounded-full bg-white/80 p-1 text-gray-500 backdrop-blur-sm transition-colors hover:bg-red-50 hover:text-red-600"
          title="Delete plant"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="space-y-1 text-center">
          <h3 className="truncate text-sm font-semibold text-gray-800" title={getPlantDisplayName(plant)}>
            {getPlantDisplayName(plant)}
          </h3>
          <p className="truncate text-xs text-gray-500" title={plant.type || 'Unknown type'}>
            {plant.type || 'Unknown type'}
          </p>
        </div>

        <div className="hidden text-[10px] sm:block">
          <h4 className="mb-1 font-semibold uppercase tracking-wide text-gray-500">Active Tasks</h4>
          {activeTasks.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(() => {
                // Sort tasks by priority: completed first, then by due date (most urgent first)
                const sortedTasks = [...activeTasks].sort((a, b) => {
                  const aCompleted = a.lastCompletedOn !== null;
                  const bCompleted = b.lastCompletedOn !== null;

                  if (aCompleted && !bCompleted) return -1;
                  if (!aCompleted && bCompleted) return 1;

                  if (aCompleted === bCompleted) {
                    const now = new Date();
                    const aDue = new Date(a.nextDueOn);
                    const bDue = new Date(b.nextDueOn);
                    const aDaysUntilDue = Math.ceil((aDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const bDaysUntilDue = Math.ceil((bDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    return aDaysUntilDue - bDaysUntilDue;
                  }

                  return 0;
                });

                return sortedTasks.slice(0, 3).map((task) => {
                  const now = new Date();
                  const isCompleted = task.lastCompletedOn ?
                    Math.abs(new Date(task.lastCompletedOn).getTime() - now.getTime()) < 24 * 60 * 60 * 1000 : false;

                  if (isCompleted) {
                    return (
                      <div key={task.id} className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-[2px]">
                        <span className="text-[10px]">{getTaskIcon(task.taskKey)}</span>
                        <span className="text-[10px] text-green-600">Done</span>
                      </div>
                    );
                  } else {
                    const status = getTaskStatus(task);
                    return (
                      <div key={task.id} className="flex items-center gap-1 rounded-full bg-gray-50 px-2 py-[2px]">
                        <span className="text-[10px]">{getTaskIcon(task.taskKey)}</span>
                        <span className={`text-[10px] ${status.color}`}>{status.text}</span>
                      </div>
                    );
                  }
                });
              })()}
              {activeTasks.length > 3 && (
                <p className="text-[10px] text-gray-500">+{activeTasks.length - 3} more tasks</p>
              )}
            </div>
          ) : (
            <p className="text-gray-400">No active tasks</p>
          )}
        </div>

        <footer className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2 text-[10px] text-gray-500">
          <span>{plant._count.notes} notes <br/> {plant._count.photos} photos</span>
          <span className="font-medium text-emerald-600">View</span>
        </footer>
      </div>
    </div>
  );
}
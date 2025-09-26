import React from 'react';
import { ChevronRight } from 'lucide-react';

interface PlantPhoto {
  id: string;
  plantId: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  takenAt: string;
  pointsAwarded: number;
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

interface CalendarPlantCardProps {
  plant: Plant;
  tasks: CalendarTask[];
  onCardClick: (plant: Plant, tasks: CalendarTask[]) => void;
  getPlantDisplayName: (plant: Plant) => string;
}

export const CalendarPlantCard: React.FC<CalendarPlantCardProps> = ({
  plant,
  tasks,
  onCardClick,
  getPlantDisplayName,
}) => {
  const handleClick = () => {
    onCardClick(plant, tasks);
  };

  return (
    <div
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center gap-4">
        {/* Plant Photo */}
        <div className="flex-shrink-0">
          {plant.photos && plant.photos.length > 0 ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden">
              <img
                src={plant.photos[0].secureUrl}
                alt={getPlantDisplayName(plant)}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌿</span>
            </div>
          )}
        </div>

        {/* Plant Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-lg truncate">
            {getPlantDisplayName(plant)}
          </h3>
          {plant.botanicalName && (
            <p className="text-sm text-gray-600 truncate">
              {plant.botanicalName}
            </p>
          )}
          <p className="text-sm text-emerald-600 font-medium">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0">
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

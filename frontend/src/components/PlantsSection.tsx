import React from 'react';
import { HomePlantCard } from './HomePlantCard';

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

interface PlantsSectionProps {
  plants: Plant[];
  onAddPlant: () => void;
  onPlantClick: (plantId: string) => void;
  onDeletePlant: (plantId: string, plantName: string) => void;
  getPlantDisplayName: (plant: Plant) => string;
  getPlantHealth: (plant: Plant) => { status: string; color: string };
  getTaskIcon: (taskKey: string) => string;
  getTaskStatus: (task: PlantTask) => { status: string; text: string; color: string };
  swipeCardRefs: React.MutableRefObject<{ [key: string]: any | null }>;
}

export const PlantsSection: React.FC<PlantsSectionProps> = ({
  plants,
  onAddPlant,
  onPlantClick,
  onDeletePlant,
  getPlantDisplayName,
  getPlantHealth,
  getTaskIcon,
  getTaskStatus,
  swipeCardRefs,
}) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Your Plants</h3>
        <button 
          onClick={onAddPlant}
          className="px-3 sm:px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors duration-200 text-sm sm:text-base"
        >
          Add Plant
        </button>
      </div>
      
      {plants.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl sm:text-3xl">🌱</span>
          </div>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">No plants yet</p>
          <p className="text-xs sm:text-sm text-gray-500">
            Start by adding your first plant to begin your care journey
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
          {plants.map((plant) => (
            <HomePlantCard
              key={plant.id}
              plant={plant}
              onPlantClick={onPlantClick}
              onDelete={onDeletePlant}
              getPlantDisplayName={getPlantDisplayName}
              getPlantHealth={getPlantHealth}
              getTaskIcon={getTaskIcon}
              getTaskStatus={getTaskStatus}
              swipeCardRef={swipeCardRefs.current[plant.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

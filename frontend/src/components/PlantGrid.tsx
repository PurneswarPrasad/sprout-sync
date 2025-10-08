import React from 'react';
import { Leaf } from 'lucide-react';
import { PlantCard } from './PlantCard';

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
  petFriendliness?: {
    isFriendly: boolean;
    reason: string;
  };
  commonPestsAndDiseases?: string;
  preventiveMeasures?: string;
  _count: {
    notes: number;
    photos: number;
  };
}

interface PlantGridProps {
  plants: Plant[];
  searchTerm: string;
  onDeletePlant: (plantId: string, plantName: string) => void;
}

export function PlantGrid({ plants, searchTerm, onDeletePlant }: PlantGridProps) {
  if (plants.length === 0) {
    return (
      <div className="text-center py-12">
        <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No plants found</h3>
        <p className="text-gray-500 mb-4">
          {searchTerm ? 'Try adjusting your search terms.' : 'Start by adding your first plant!'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {plants.map((plant) => (
        <PlantCard
          key={plant.id}
          plant={plant}
          onDelete={onDeletePlant}
        />
      ))}
    </div>
  );
}

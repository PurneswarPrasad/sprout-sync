import React from 'react';
import { Leaf, Plus } from 'lucide-react';
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
  onAddPlant: () => void;
  emptyHeading?: string;
  emptyDescription?: string;
}

export function PlantGrid({ plants, searchTerm, onDeletePlant, onAddPlant, emptyHeading, emptyDescription }: PlantGridProps) {
  const hasPlants = plants.length > 0;

  if (!hasPlants) {
    const heading = emptyHeading || 'No plants yet';
    const description = searchTerm
      ? 'Try adjusting your search terms.'
      : (emptyDescription || 'Start by adding your first plant!');

    return (
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <button
          onClick={onAddPlant}
          className="flex h-full min-h-[160px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-white/60 p-4 text-emerald-600 shadow-sm transition hover:border-emerald-500 hover:bg-emerald-50"
        >
          <Plus className="mb-2 h-8 w-8" />
          <span className="text-xs font-semibold">Add plant</span>
        </button>
        <div className="col-span-2 flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white/60 p-4 text-center shadow-sm sm:col-span-2">
          <Leaf className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-medium text-gray-700">{heading}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      <button
        onClick={onAddPlant}
        className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-white/60 p-3 text-emerald-600 shadow-sm transition hover:border-emerald-500 hover:bg-emerald-50"
      >
        <Plus className="mb-2 h-7 w-7" />
        <span className="text-[11px] font-semibold">Add plant</span>
      </button>
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

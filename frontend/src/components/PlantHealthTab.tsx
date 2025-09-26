import React from 'react';
import { PlantActionButtons } from './PlantActionButtons';
import { PlantTrackingCard } from './PlantTrackingCard';

interface PlantTrackingUpdate {
  id: string;
  plantId: string;
  date: string;
  note: string;
  photoUrl: string | null; // Optimized URL for display
  originalPhotoUrl: string | null; // Original URL for AI processing
  cloudinaryPublicId: string | null;
  createdAt: string;
}

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

interface PlantHealthTabProps {
  plant: Plant;
  trackingUpdates: PlantTrackingUpdate[];
  loadingTracking: boolean;
  onTrackPlant: () => void;
  onMonitorHealth: () => void;
  onOpenTracking: (tracking: PlantTrackingUpdate) => void;
  onDeleteTracking: (trackingId: string) => void;
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

export function PlantHealthTab({
  plant,
  trackingUpdates,
  loadingTracking,
  onTrackPlant,
  onMonitorHealth,
  onOpenTracking,
  onDeleteTracking
}: PlantHealthTabProps) {
  return (
    <div className="flex flex-col">
      {/* Action Buttons - Centered in remaining space */}
      <div className={`flex items-center justify-center ${trackingUpdates.length > 0 ? 'py-8' : 'min-h-[60vh]'}`}>
        <PlantActionButtons
          plantName={getPlantDisplayName(plant)}
          onTrackPlant={onTrackPlant}
          onMonitorHealth={onMonitorHealth}
        />
      </div>

      {/* Tracking Updates - Only show if there are updates */}
      {trackingUpdates.length > 0 && (
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Tracking Updates</h2>
          {loadingTracking ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading tracking updates...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trackingUpdates.map((update) => (
                <PlantTrackingCard
                  key={update.id}
                  tracking={update}
                  onOpen={onOpenTracking}
                  onDelete={onDeleteTracking}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

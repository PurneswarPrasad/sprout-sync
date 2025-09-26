import React from 'react';
import { PlantCareCards } from './PlantCareCards';

interface SelectedTask {
  key: string;
  label: string;
  colorHex: string;
  frequency: number;
  lastCompleted?: string;
  isSuggested?: boolean;
}

interface PlantCareInfoSectionProps {
  hasProcessedAI: boolean;
  careLevel: string;
  sunRequirements: string;
  toxicityLevel: string;
  selectedTasks: SelectedTask[];
}

export const PlantCareInfoSection: React.FC<PlantCareInfoSectionProps> = ({
  hasProcessedAI,
  careLevel,
  sunRequirements,
  toxicityLevel,
  selectedTasks,
}) => {
  // Only show if coming from AI identification and has care information
  if (!hasProcessedAI || (!careLevel && !sunRequirements && !toxicityLevel && selectedTasks.length === 0)) {
    return null;
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Plant Care Information</h2>
      <PlantCareCards
        careLevel={careLevel as 'Easy' | 'Moderate' | 'Difficult' | undefined}
        waterFrequency={selectedTasks.find(task => task.key === 'watering')?.frequency}
        sunRequirements={sunRequirements as 'No sun' | 'Part to Full' | 'Full sun' | undefined}
        toxicityLevel={toxicityLevel as 'Low' | 'Medium' | 'High' | undefined}
      />
    </div>
  );
};

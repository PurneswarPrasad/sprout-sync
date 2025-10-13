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
  careLevel?: string | {
    level: 'Easy' | 'Moderate' | 'Difficult';
    description: string;
    maintenanceTips: string;
  };
  sunRequirements?: string | {
    level: 'No sun' | 'Part to Full' | 'Full sun';
    description: string;
    placementTips: string;
  };
  toxicityLevel?: string | {
    level: 'Low' | 'Medium' | 'High';
    description: string;
    safetyTips: string;
  };
  selectedTasks: SelectedTask[];
}

export const PlantCareInfoSection = React.forwardRef<HTMLDivElement, PlantCareInfoSectionProps>(({
  hasProcessedAI,
  careLevel,
  sunRequirements,
  toxicityLevel,
  selectedTasks,
}, ref) => {
  // Only show if coming from AI identification and has care information
  if (!hasProcessedAI || (!careLevel && !sunRequirements && !toxicityLevel && selectedTasks.length === 0)) {
    return null;
  }

  return (
    <div ref={ref} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Plant Care Information</h2>
      <PlantCareCards
        careLevel={careLevel}
        waterFrequency={selectedTasks.find(task => task.key === 'watering')?.frequency}
        sunRequirements={sunRequirements}
        toxicityLevel={toxicityLevel}
      />
    </div>
  );
});

PlantCareInfoSection.displayName = 'PlantCareInfoSection';

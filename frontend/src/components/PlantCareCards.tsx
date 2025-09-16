import React from 'react';

interface PlantCareCardsProps {
  careLevel?: 'Easy' | 'Moderate' | 'Difficult';
  waterFrequency?: number; // in days
  sunRequirements?: 'No sun' | 'Part to Full' | 'Full sun';
  toxicityLevel?: 'Low' | 'Medium' | 'High';
  className?: string;
}

// Helper function to convert frequency days to readable text (same logic as PlantDetailPage)
const getFrequencyText = (frequencyDays: number) => {
  if (frequencyDays === 1) return 'Every day';
  if (frequencyDays === 2) return 'Every 2 days';
  if (frequencyDays === 7) return 'Every week';
  if (frequencyDays === 14) return 'Every 2 weeks';
  if (frequencyDays === 30) return 'Every month';
  if (frequencyDays === 90) return 'Every 3 months';
  if (frequencyDays === 180) return 'Every 6 months';
  if (frequencyDays === 365) return 'Every year';
  if (frequencyDays === 540) return 'Every 18 months';
  return `Every ${frequencyDays} days`;
};

// Helper function to get care level color
const getCareLevelColor = (level: string) => {
  switch (level) {
    case 'Easy': return 'text-green-600';
    case 'Moderate': return 'text-yellow-600';
    case 'Difficult': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

// Helper function to get toxicity level color
const getToxicityLevelColor = (level: string) => {
  switch (level) {
    case 'Low': return 'text-green-600';
    case 'Medium': return 'text-yellow-600';
    case 'High': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

// Helper function to get sun requirements color
const getSunRequirementsColor = (level: string) => {
  switch (level) {
    case 'No sun': return 'text-blue-600';
    case 'Part to Full': return 'text-yellow-600';
    case 'Full sun': return 'text-orange-600';
    default: return 'text-gray-600';
  }
};

export const PlantCareCards: React.FC<PlantCareCardsProps> = ({
  careLevel = 'Moderate',
  waterFrequency = 7,
  sunRequirements = 'Part to Full',
  toxicityLevel = 'Low',
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
      {/* Care Level Card */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col items-center text-center">
          <div className="w-8 h-8 mb-2 flex items-center justify-center">
            <img src="/plant.png" alt="Plant care" className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm mb-1">Care</h3>
          <p className={`text-xs font-medium ${getCareLevelColor(careLevel)}`}>
            {careLevel}
          </p>
        </div>
      </div>

      {/* Water Frequency Card */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col items-center text-center">
          <div className="w-8 h-8 mb-2 flex items-center justify-center">
            <img src="/watering-plants.png" alt="Watering plants" className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm mb-1">Water</h3>
          <p className="text-xs text-gray-600">
            {getFrequencyText(waterFrequency)}
          </p>
        </div>
      </div>

      {/* Sun Requirements Card */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col items-center text-center">
          <div className="w-8 h-8 mb-2 flex items-center justify-center">
            <img src="/happy.png" alt="Sun requirements" className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm mb-1">Sun</h3>
          <p className={`text-xs font-medium ${getSunRequirementsColor(sunRequirements)}`}>
            {sunRequirements}
          </p>
        </div>
      </div>

      {/* Toxicity Level Card */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col items-center text-center">
          <div className="w-8 h-8 mb-2 flex items-center justify-center">
            <img src="/danger.png" alt="Toxicity level" className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-gray-800 text-sm mb-1">Toxicity</h3>
          <p className={`text-xs font-medium ${getToxicityLevelColor(toxicityLevel)}`}>
            {toxicityLevel}
          </p>
        </div>
      </div>
    </div>
  );
};

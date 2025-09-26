import React from 'react';
import { Clock, CheckCircle, Loader2 } from 'lucide-react';

interface Task {
  id: string;
  taskKey: string;
  frequencyDays: number;
  nextDueOn: string;
  active: boolean;
  plant: {
    id: string;
    petName?: string;
    botanicalName?: string;
    commonName?: string;
    type?: string;
  };
}

interface Plant {
  id: string;
  petName?: string;
  botanicalName?: string;
  commonName?: string;
  type?: string;
  tasks: Task[];
}

const REMINDER_OPTIONS = [
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 240, label: '4 hours before' },
  { value: 1440, label: '1 day before' },
];

interface SetupStepProps {
  plants: Plant[];
  selectedPlantIds: string[];
  reminderMinutes: number;
  loading: boolean;
  onPlantToggle: (plantId: string) => void;
  onReminderChange: (minutes: number) => void;
  onSaveSettings: () => void;
  onBack: () => void;
}

export const SetupStep: React.FC<SetupStepProps> = ({
  plants,
  selectedPlantIds,
  reminderMinutes,
  loading,
  onPlantToggle,
  onReminderChange,
  onSaveSettings,
  onBack,
}) => {
  const getPlantName = (plant: Plant) => {
    return plant.petName || plant.commonName?.split(',')[0].trim() || plant.botanicalName || 'Unknown Plant';
  };

  const getActiveTaskCount = (plant: Plant) => {
    return plant.tasks?.filter(task => task.active).length || 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sync Configuration</h3>
        
        {/* Plant Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Plants to Sync
          </label>
          <div className="space-y-2">
            {plants.map(plant => {
              const taskCount = getActiveTaskCount(plant);
              const isSelected = selectedPlantIds.includes(plant.id);
              const plantName = getPlantName(plant);
              
              return (
                <label key={plant.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onPlantToggle(plant.id)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium text-gray-900">
                        {plantName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {taskCount} active task{taskCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Reminder Settings */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Clock className="w-4 h-4 inline mr-2" />
            Reminder Time
          </label>
          <select
            value={reminderMinutes}
            onChange={(e) => onReminderChange(Number(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            {REMINDER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onSaveSettings}
            disabled={loading || selectedPlantIds.length === 0}
            className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            <span>Save Settings</span>
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

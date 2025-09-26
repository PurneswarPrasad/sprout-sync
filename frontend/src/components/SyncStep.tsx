import React from 'react';

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

interface SyncStepProps {
  plants: Plant[];
  selectedPlantIds: string[];
  recentlySyncedPlantIds: string[];
  reminderMinutes: number;
  loading: boolean;
  onDisableSync: () => void;
  onClose: () => void;
}

export const SyncStep: React.FC<SyncStepProps> = ({
  plants,
  selectedPlantIds,
  recentlySyncedPlantIds,
  reminderMinutes,
  loading,
  onDisableSync,
  onClose,
}) => {
  const getPlantName = (plant: Plant) => {
    return plant.petName || plant.commonName?.split(',')[0].trim() || plant.botanicalName || 'Unknown Plant';
  };

  const getActiveTaskCount = (plant: Plant) => {
    return plant.tasks?.filter(task => task.active).length || 0;
  };

  const getTotalActiveTasks = () => {
    const referenceIds = recentlySyncedPlantIds.length > 0 ? recentlySyncedPlantIds : selectedPlantIds;
    return plants
      .filter(plant => referenceIds.includes(plant.id))
      .reduce((total, plant) => total + getActiveTaskCount(plant), 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sync Successful!</h3>
        <p className="text-sm text-gray-600 mb-6">
          Your plant care tasks have been updated on Google Calendar. You'll receive reminders for your selected plants.
        </p>

        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h4 className="text-sm font-medium text-green-900 mb-2">Sync Settings:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Plants: {plants.filter(plant => (recentlySyncedPlantIds.length > 0 ? recentlySyncedPlantIds : selectedPlantIds).includes(plant.id)).map(plant => getPlantName(plant)).join(', ')}</li>
            <li>• Reminder: {REMINDER_OPTIONS.find(opt => opt.value === reminderMinutes)?.label}</li>
            <li>• Total tasks synced: {getTotalActiveTasks()}</li>
          </ul>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onDisableSync}
            disabled={loading}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            Disable Sync
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

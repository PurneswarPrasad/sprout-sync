import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarPlantCard } from './CalendarPlantCard';

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

interface TasksListProps {
  selectedDate: Date;
  selectedDateTaskType: string;
  selectedDateGroupedTasks: Record<string, { plant: Plant | undefined, tasks: CalendarTask[] }>;
  onPlantCardClick: (plant: Plant, tasks: CalendarTask[]) => void;
  getPlantDisplayName: (plant: Plant) => string;
}

export const TasksList: React.FC<TasksListProps> = ({
  selectedDate,
  selectedDateTaskType,
  selectedDateGroupedTasks,
  onPlantCardClick,
  getPlantDisplayName,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          {selectedDateTaskType} - {format(selectedDate, 'MMM d, yyyy')}
        </h3>
        
        {Object.keys(selectedDateGroupedTasks).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(selectedDateGroupedTasks).map(([plantId, group]) => {
              const plant = group.plant;
              const plantTasks = group.tasks;
              
              if (!plant) return null;

              return (
                <CalendarPlantCard
                  key={plantId}
                  plant={plant}
                  tasks={plantTasks}
                  onCardClick={onPlantCardClick}
                  getPlantDisplayName={getPlantDisplayName}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">No tasks for this date</h3>
            <p className="text-gray-400">Select a different date to view tasks.</p>
          </div>
        )}
      </div>
    </div>
  );
};

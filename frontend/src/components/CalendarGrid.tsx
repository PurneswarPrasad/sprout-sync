import React from 'react';
import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';

interface PlantPhoto {
  id: string;
  plantId: string;
  cloudinaryPublicId: string;
  secureUrl: string;
  takenAt: string;
  pointsAwarded: number;
}

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date;
  onDateClick: (date: Date) => void;
  getPlantPhotosForDate: (date: Date) => PlantPhoto[];
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  selectedDate,
  onDateClick,
  getPlantPhotosForDate,
}) => {
  // Get month days for calendar grid
  const getMonthDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  const monthDays = getMonthDays();

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const plantPhotos = getPlantPhotosForDate(day);

          return (
            <button
              key={day.toString()}
              onClick={() => onDateClick(day)}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-emerald-600 text-white'
                  : isToday
                  ? 'bg-emerald-100 text-emerald-700'
                  : isCurrentMonth
                  ? 'text-gray-800 hover:bg-gray-100'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {format(day, 'd')}
              
              {/* Plant photos */}
              {plantPhotos.length > 0 && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                  {plantPhotos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo.secureUrl}
                      alt="Plant"
                      className="w-3 h-3 rounded-full object-cover border border-white"
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

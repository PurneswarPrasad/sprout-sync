import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';

interface CalendarHeaderProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onPreviousMonth,
  onNextMonth,
}) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Calendar</h1>
      <p className="text-sm text-gray-500 mb-4">Click on any date to view tasks for that day</p>
      
      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={onPreviousMonth}
          className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button
          onClick={onNextMonth}
          className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

import React from 'react';

interface StatsCardsProps {
  totalPlants: number;
  todaysTasksCount: number;
  overdueTasksCount: number;
  completedTasksCount: number;
  firstName?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalPlants,
  todaysTasksCount,
  overdueTasksCount,
  completedTasksCount,
  firstName,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Total Plants</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{totalPlants}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <span className="text-lg sm:text-2xl">🌿</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Today's Tasks</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{todaysTasksCount}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-lg sm:text-2xl">📋</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{completedTasksCount}</p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <span className="text-lg sm:text-2xl">✅</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-600">
              {overdueTasksCount === 0 ? 'All Caught Up!' : 'Overdue'}
            </p>
            {overdueTasksCount === 0 ? (
              <p className="text-xs sm:text-sm font-semibold text-emerald-600">
                Great job{firstName ? `, ${firstName}` : ''}!
              </p>
            ) : (
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{overdueTasksCount}</p>
            )}
          </div>
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
            overdueTasksCount === 0 ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            <span className="text-lg sm:text-2xl">{overdueTasksCount === 0 ? '🎉' : '⚠️'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

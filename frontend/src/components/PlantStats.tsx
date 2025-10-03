import React from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

interface PlantStatsProps {
  user: User | null;
  plantCount: number;
}

export function PlantStats({ user, plantCount }: PlantStatsProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
      {plantCount > 0 ? (
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Hi {user?.name}, your garden has {plantCount} plants
        </h2>
      ) : (
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Hi {user?.name}, your garden is empty!
        </h2>
      )}
      </div>
      {/* <select className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500">
        <option>All Plants</option>
        <option>Healthy</option>
        <option>Needs Care</option>
      </select> */}
    </div>
  );
}

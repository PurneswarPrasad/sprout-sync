import React from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function SearchFilter({ searchTerm, onSearchChange }: SearchFilterProps) {
  return (
    <div className="flex space-x-3">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search plants..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>
      <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <Filter className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
}

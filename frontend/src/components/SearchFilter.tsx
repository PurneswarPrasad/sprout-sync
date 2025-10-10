import React, { useEffect, useRef, useState } from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeFilter: 'all' | 'your-plants' | 'gifted-plants';
  onFilterChange: (value: 'all' | 'your-plants' | 'gifted-plants') => void;
}

export function SearchFilter({ searchTerm, onSearchChange, activeFilter, onFilterChange }: SearchFilterProps) {
  const filterOptions: { label: string; value: 'all' | 'your-plants' | 'gifted-plants' }[] = [
    { label: 'All plants', value: 'all' },
    { label: 'Your plants', value: 'your-plants' },
    { label: 'Gifted plants', value: 'gifted-plants' },
  ];

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={filterRef}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search plants..."
        className="w-full rounded-xl border border-gray-200 bg-white/80 py-2 pl-10 pr-28 text-sm shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <button
        type="button"
        onClick={() => setIsFilterOpen((prev) => !prev)}
        className={`absolute right-1 top-1/2 flex h-9 -translate-y-1/2 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition ${
          isFilterOpen ? 'border-emerald-400 bg-white shadow-md' : 'border-transparent bg-white/90 shadow-sm'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isFilterOpen}
        aria-label="Filter plants"
      >
        <Filter className="h-4 w-4 text-gray-600" />
        <span className="text-gray-700">
          {filterOptions.find(option => option.value === activeFilter)?.label ?? 'All plants'}
        </span>
      </button>

      {isFilterOpen && (
        <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
          <ul role="listbox" aria-label="Filter plants" className="divide-y divide-gray-100">
            {filterOptions.map((option) => {
              const isSelected = option.value === activeFilter;

              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onFilterChange(option.value);
                      setIsFilterOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-sm transition hover:bg-emerald-50 ${
                      isSelected ? 'text-emerald-600 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                    {isSelected && <span className="text-xs">✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

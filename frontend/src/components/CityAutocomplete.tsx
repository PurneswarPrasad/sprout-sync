import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X, MapPin } from 'lucide-react';
import { cityService, CitySuggestion } from '../services/cityService';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "e.g., New York",
  className = "",
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number, width: number} | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current && isOpen) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Update position when opening dropdown
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      
      // Update position on scroll/resize
      const handleUpdate = () => updateDropdownPosition();
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
      
      return () => {
        window.removeEventListener('scroll', handleUpdate, true);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const data = await cityService.searchCities(debouncedQuery);
        setSuggestions(data);
        setIsOpen(data.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectCity(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, selectedIndex, suggestions]);

  // Format city for display
  const formatCityDisplay = (suggestion: CitySuggestion) => {
    return cityService.formatCityForDisplay(suggestion);
  };

  // Format city for storage
  const formatCityStorage = (suggestion: CitySuggestion) => {
    return cityService.formatCityForStorage(suggestion);
  };

  // Select a city
  const selectCity = (suggestion: CitySuggestion) => {
    const formattedCity = formatCityStorage(suggestion);
    setQuery(formattedCity);
    onChange(formattedCity);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Clear the input
  const clearInput = () => {
    setQuery('');
    onChange('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pr-10"
        />
        
        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
        
        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Portal-based Suggestions dropdown */}
      {isOpen && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          className="absolute bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 50
          }}
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2"></div>
              Searching cities...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.place_id}
                  type="button"
                  onClick={() => selectCity(suggestion)}
                  className={`w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-center gap-3 ${
                    index === selectedIndex ? 'bg-emerald-50' : ''
                  }`}
                >
                  <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">
                      {suggestion.address.city}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {formatCityDisplay(suggestion)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : debouncedQuery.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              No cities found for "{debouncedQuery}"
            </div>
          ) : null}
        </div>,
        document.body
      )}
    </div>
  );
};
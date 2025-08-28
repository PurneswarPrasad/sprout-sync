import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CityAutocomplete } from '../CityAutocomplete';

// Mock the city service
jest.mock('../../services/cityService', () => ({
  cityService: {
    searchCities: jest.fn(),
    formatCityForDisplay: jest.fn((suggestion) => `${suggestion.address.city}, ${suggestion.address.country}`),
    formatCityForStorage: jest.fn((suggestion) => `${suggestion.address.city}, ${suggestion.address.country}`),
  },
}));

describe('CityAutocomplete', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with placeholder', () => {
    render(
      <CityAutocomplete
        value=""
        onChange={mockOnChange}
        placeholder="Enter city"
      />
    );

    expect(screen.getByPlaceholderText('Enter city')).toBeInTheDocument();
  });

  it('shows loading state when searching', async () => {
    const { cityService } = require('../../services/cityService');
    cityService.searchCities.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <CityAutocomplete
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText('e.g., New York');
    fireEvent.change(input, { target: { value: 'Mum' } });

    await waitFor(() => {
      expect(screen.getByText('Searching cities...')).toBeInTheDocument();
    });
  });

  it('calls onChange when input changes', () => {
    render(
      <CityAutocomplete
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText('e.g., New York');
    fireEvent.change(input, { target: { value: 'Mumbai' } });

    expect(mockOnChange).toHaveBeenCalledWith('Mumbai');
  });

  it('shows clear button when value is present', () => {
    render(
      <CityAutocomplete
        value="Mumbai, India"
        onChange={mockOnChange}
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', () => {
    render(
      <CityAutocomplete
        value="Mumbai, India"
        onChange={mockOnChange}
      />
    );

    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });
});


export interface CitySuggestion {
  place_id: number;
  name: string;
  display_name: string;
  address: {
    city: string;
    state?: string;
    country: string;
    country_code: string;
  };
}

// Mock data for local development
const mockCities: CitySuggestion[] = [
  {
    place_id: 1,
    name: "Mumbai",
    display_name: "Mumbai, Maharashtra, India",
    address: {
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      country_code: "in"
    }
  },
  {
    place_id: 2,
    name: "New York",
    display_name: "New York, New York, United States",
    address: {
      city: "New York",
      state: "New York",
      country: "United States",
      country_code: "us"
    }
  },
  {
    place_id: 3,
    name: "London",
    display_name: "London, Greater London, United Kingdom",
    address: {
      city: "London",
      state: "Greater London",
      country: "United Kingdom",
      country_code: "gb"
    }
  },
  {
    place_id: 4,
    name: "Tokyo",
    display_name: "Tokyo, Tokyo, Japan",
    address: {
      city: "Tokyo",
      state: "Tokyo",
      country: "Japan",
      country_code: "jp"
    }
  },
  {
    place_id: 5,
    name: "Paris",
    display_name: "Paris, Île-de-France, France",
    address: {
      city: "Paris",
      state: "Île-de-France",
      country: "France",
      country_code: "fr"
    }
  },
  {
    place_id: 6,
    name: "Sydney",
    display_name: "Sydney, New South Wales, Australia",
    address: {
      city: "Sydney",
      state: "New South Wales",
      country: "Australia",
      country_code: "au"
    }
  },
  {
    place_id: 7,
    name: "Toronto",
    display_name: "Toronto, Ontario, Canada",
    address: {
      city: "Toronto",
      state: "Ontario",
      country: "Canada",
      country_code: "ca"
    }
  },
  {
    place_id: 8,
    name: "Berlin",
    display_name: "Berlin, Berlin, Germany",
    address: {
      city: "Berlin",
      state: "Berlin",
      country: "Germany",
      country_code: "de"
    }
  }
];

export class CityService {
  // Set to false to use real Nominatim API, true for mock data
  // Note: Nominatim has rate limits and may have CORS issues in some browsers
  private useMockData = false; // Changed to false to enable real API

  async searchCities(query: string): Promise<CitySuggestion[]> {
    try {
      if (this.useMockData) {
        return this.searchMockCities(query);
      }

      return await this.searchNominatimCities(query);
    } catch (error) {
      console.warn('Falling back to mock data due to API error:', error);
      return this.searchMockCities(query);
    }
  }

  private searchMockCities(query: string): CitySuggestion[] {
    const lowercaseQuery = query.toLowerCase();
    return mockCities
      .filter(city => 
        city.address.city.toLowerCase().includes(lowercaseQuery) ||
        city.address.country.toLowerCase().includes(lowercaseQuery) ||
        (city.address.state && city.address.state.toLowerCase().includes(lowercaseQuery))
      )
      .slice(0, 5);
  }

  private async searchNominatimCities(query: string): Promise<CitySuggestion[]> {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&featuretype=city`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SproutSync/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Nominatim response to match your CitySuggestion interface
    return data.map((item: any, index: number) => ({
      place_id: parseInt(item.place_id) || index,
      name: item.name || item.display_name.split(',')[0],
      display_name: item.display_name,
      address: {
        city: item.address?.city || item.address?.town || item.address?.village || item.name || item.display_name.split(',')[0],
        state: item.address?.state,
        country: item.address?.country,
        country_code: item.address?.country_code
      }
    }));
  }

  // Format city for storage (city, country)
  formatCityForStorage(suggestion: CitySuggestion): string {
    const { city, country } = suggestion.address;
    return country ? `${city}, ${country}` : city;
  }

  // Format city for display (city, state, country)
  formatCityForDisplay(suggestion: CitySuggestion): string {
    const { city, state, country } = suggestion.address;
    if (state && state !== city) {
      return `${city}, ${state}, ${country}`;
    }
    return `${city}, ${country}`;
  }
}

export const cityService = new CityService();
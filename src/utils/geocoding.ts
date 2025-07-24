/**
 * Geocoding utility for converting location strings to coordinates
 * and handling PostgreSQL point type conversions
 */

// Define the Coordinates interface
export interface Coordinates {
  lat: number;
  lng: number;
}

// Cache to avoid redundant API calls
const geocodeCache = new Map<string, Coordinates>();

// Default coordinates for Sri Lanka center (fallback)
export const SRI_LANKA_CENTER: Coordinates = { lat: 7.8731, lng: 80.7718 };

// Sri Lanka bounds for validation
const SRI_LANKA_BOUNDS = {
  north: 9.9,  // Northern point
  south: 5.9,  // Southern point
  east: 82.0,  // Eastern point
  west: 79.5   // Western point
};

/**
 * Validates if coordinates are within Sri Lanka bounds
 */
export function isWithinSriLanka(coords: Coordinates): boolean {
  return (
    coords.lat >= SRI_LANKA_BOUNDS.south &&
    coords.lat <= SRI_LANKA_BOUNDS.north &&
    coords.lng >= SRI_LANKA_BOUNDS.west &&
    coords.lng <= SRI_LANKA_BOUNDS.east
  );
}

/**
 * Geocodes a location string to coordinates
 * Uses Nominatim/OpenStreetMap API with Sri Lanka as region bias
 */
export async function geocodeLocation(location: string): Promise<Coordinates> {
  // Check cache first
  if (geocodeCache.has(location)) {
    return geocodeCache.get(location)!;
  }
  
  // For development/testing, use a simple mapping for common Sri Lanka locations
  const mockLocations: Record<string, Coordinates> = {
    'Colombo': { lat: 6.9271, lng: 79.8612 },
    'Kandy': { lat: 7.2906, lng: 80.6337 },
    'Galle': { lat: 6.0535, lng: 80.2210 },
    'Jaffna': { lat: 9.6615, lng: 80.0255 },
    'Trincomalee': { lat: 8.5874, lng: 81.2152 },
    'Batticaloa': { lat: 7.7170, lng: 81.7000 },
    'Negombo': { lat: 7.2081, lng: 79.8352 },
    'Anuradhapura': { lat: 8.3114, lng: 80.4037 }
  };
  
  // Check if the location is in our mock data
  for (const [key, value] of Object.entries(mockLocations)) {
    if (location.toLowerCase().includes(key.toLowerCase())) {
      geocodeCache.set(location, value);
      return value;
    }
  }
  
  // Call geocoding API (Nominatim/OpenStreetMap)
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)},Sri Lanka&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'GreenLink-TransporterApp/1.0'  // Required by Nominatim ToS
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const coords: Coordinates = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
      
      // Validate if within Sri Lanka
      if (isWithinSriLanka(coords)) {
        // Save to cache
        geocodeCache.set(location, coords);
        return coords;
      }
    }
    
    // If we get here, either no results or not in Sri Lanka
    console.warn(`Location not found in Sri Lanka: ${location}`);
    return getRandomSriLankaLocation(location);
    
  } catch (error) {
    console.error('Geocoding error:', error);
    // Fallback to a random location in Sri Lanka
    return getRandomSriLankaLocation(location);
  }
}

/**
 * Generates a random location within Sri Lanka bounds
 * Used as fallback when geocoding fails
 */
function getRandomSriLankaLocation(seed: string): Coordinates {
  // Use the seed string to generate a "random" but consistent location
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Generate coordinates within Sri Lanka bounds
  const lat = SRI_LANKA_BOUNDS.south + (hash % 100) / 100 * (SRI_LANKA_BOUNDS.north - SRI_LANKA_BOUNDS.south);
  const lng = SRI_LANKA_BOUNDS.west + ((hash * 31) % 100) / 100 * (SRI_LANKA_BOUNDS.east - SRI_LANKA_BOUNDS.west);
  
  const coords = { lat, lng };
  geocodeCache.set(seed, coords);
  return coords;
}

/**
 * Parses PostgreSQL point type string to Coordinates
 * PostgreSQL point format is "(x,y)" where x is longitude and y is latitude
 */
export function parsePostgresPoint(point: string): Coordinates {
  try {
    // PostgreSQL point format is "(x,y)" where x is longitude and y is latitude
    const match = point.match(/\((-?\d+\.?\d*),(-?\d+\.?\d*)\)/);
    if (match) {
      return {
        lng: parseFloat(match[1]),
        lat: parseFloat(match[2])
      };
    }
    throw new Error(`Invalid point format: ${point}`);
  } catch (error) {
    console.error('Error parsing PostgreSQL point:', error);
    return SRI_LANKA_CENTER; // Fallback to center of Sri Lanka
  }
}

/**
 * Converts Coordinates to PostgreSQL point format
 */
export function toPostgresPoint(coords: Coordinates): string {
  return `(${coords.lng},${coords.lat})`;
}
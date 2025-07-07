/**
 * Location utility functions for distance calculations and location-based filtering
 */

export interface Location {
  latitude: number;
  longitude: number;
}

export interface LocationWithDistance extends Location {
  distance: number; // Distance in kilometers
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Filter locations within a specified radius
 * @param centerLocation - The center point (customer location)
 * @param locations - Array of locations to filter
 * @param radiusKm - Radius in kilometers
 * @returns Array of locations within the radius with distance information
 */
export function filterLocationsWithinRadius(
  centerLocation: Location,
  locations: Location[],
  radiusKm: number
): LocationWithDistance[] {
  return locations
    .map((location) => ({
      ...location,
      distance: calculateDistance(
        centerLocation.latitude,
        centerLocation.longitude,
        location.latitude,
        location.longitude
      ),
    }))
    .filter((location) => location.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Validate if coordinates are valid
 * @param latitude - Latitude value
 * @param longitude - Longitude value
 * @returns True if coordinates are valid
 */
export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Parse location from string (e.g., "lat,lng" format)
 * @param locationString - String in "latitude,longitude" format
 * @returns Location object or null if invalid
 */
export function parseLocationString(locationString: string): Location | null {
  try {
    const [lat, lng] = locationString.split(',').map(Number);
    if (isValidCoordinates(lat, lng)) {
      return { latitude: lat, longitude: lng };
    }
  } catch (error) {
    // Invalid format
    console.error('Error parsing location string:', error);
  }
  return null;
}

import { Preferences } from '@capacitor/preferences';

const RECENT_LOCATIONS_KEY = 'recentLocations';
const MAX_RECENT_LOCATIONS = 4;

export interface LocationItem {
    address: string;
    lat: number;
    lng: number;
}

/**
 * Load recent locations from Capacitor Preferences
 * Returns empty array if no locations found
 */
export async function loadRecentLocations(): Promise<LocationItem[]> {
    try {
        const { value } = await Preferences.get({ key: RECENT_LOCATIONS_KEY });
        if (!value) return [];

        const locations = JSON.parse(value) as LocationItem[];
        // Return only last 4 locations
        return locations.slice(0, MAX_RECENT_LOCATIONS);
    } catch (error) {
        console.error('Error loading recent locations:', error);
        return [];
    }
}

/**
 * Save a location to recent history
 * - Removes duplicates (same lat/lng within 0.0001 precision)
 * - Adds location to the beginning (most recent first)
 * - Limits to 4 locations
 */
export async function saveRecentLocation(location: LocationItem): Promise<void> {
    try {
        const existingLocations = await loadRecentLocations();

        // Remove duplicates - check if location already exists (within ~10m precision)
        const filteredLocations = existingLocations.filter(
            (item) =>
                Math.abs(item.lat - location.lat) > 0.0001 ||
                Math.abs(item.lng - location.lng) > 0.0001
        );

        // Add new location at the beginning
        const updatedLocations = [location, ...filteredLocations];

        // Keep only first 4 locations
        const limitedLocations = updatedLocations.slice(0, MAX_RECENT_LOCATIONS);

        // Save to preferences
        await Preferences.set({
            key: RECENT_LOCATIONS_KEY,
            value: JSON.stringify(limitedLocations),
        });
    } catch (error) {
        console.error('Error saving recent location:', error);
    }
}

/**
 * Clear all recent locations
 */
export async function clearRecentLocations(): Promise<void> {
    try {
        await Preferences.remove({ key: RECENT_LOCATIONS_KEY });
    } catch (error) {
        console.error('Error clearing recent locations:', error);
    }
}

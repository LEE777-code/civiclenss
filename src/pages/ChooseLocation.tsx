import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search, LocateFixed, Loader2, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { addLocationHistory } from "@/services/offlineService";
import { loadRecentLocations, saveRecentLocation, type LocationItem } from "@/utils/locationStorage";

// Backend URL - REQUIRED for geocoding
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://civiclens-r87i.onrender.com';

// Fix for default Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map clicks
function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const map = useMapEvents({
    click(e) {
      map.flyTo(e.latlng, map.getZoom());
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

// Component to handle external location updates
const RecenterMap = ({ lat, lng }: { lat: number, lng: number }) => {
  const map = useMap();

  useEffect(() => {
    // Set zoom limits
    map.setMinZoom(4); // Allow state/province level view, prevent excessive zoom out
    map.setMaxZoom(18); // Maximum zoom level
  }, [map]);

  useEffect(() => {
    map.flyTo([lat, lng], 16);
  }, [lat, lng, map]);
  return null;
}

const ChooseLocation = () => {
  const navigate = useNavigate();
  const locationState = useLocation().state as any; // Type assertion since useLocation state is unknown
  const previousFormData = locationState || {};

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState({
    address: "Tap on map to select",
    lat: 20.5937,
    lng: 78.9629,
  });

  // New state for search feature
  const [recentLocations, setRecentLocations] = useState<LocationItem[]>([]);
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent locations on mount
  useEffect(() => {
    const loadRecent = async () => {
      const recent = await loadRecentLocations();
      setRecentLocations(recent);
    };
    loadRecent();
  }, []);

  // Handle search query changes with debouncing
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmedQuery = searchQuery.trim();

    // If empty, clear suggestions
    if (trimmedQuery === '') {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    // If less than 3 characters, clear suggestions
    if (trimmedQuery.length < 3) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    // Show searching state immediately
    setIsSearching(true);

    // Debounce search for 200ms (faster response)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/search-location?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: AbortSignal.timeout(8000) }
        );

        if (!response.ok) {
          throw new Error(`Backend search failed: ${response.status}`);
        }

        const data = await response.json();

        // Convert to LocationItem format and take top 4
        const searchResults: LocationItem[] = data.slice(0, 4).map((item: any) => ({
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));

        setSuggestions(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handler for selecting a location from dropdown
  const handleSelectLocation = async (item: LocationItem) => {
    setSearchQuery(item.address);
    setShowDropdown(false);
    setSuggestions([]);

    // Update map and location
    await updateLocation(item.lat, item.lng);

    // Save to recent locations
    await saveRecentLocation(item);

    // Update recent locations list
    const updated = await loadRecentLocations();
    setRecentLocations(updated);
  };


  const updateLocation = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      // ONLY call backend API - no fallback to Nominatim
      const response = await fetch(
        `${BACKEND_URL}/api/reverse-geocode?lat=${lat}&lon=${lng}`,
        { signal: AbortSignal.timeout(8000) } // 8 second timeout
      );

      if (!response.ok) {
        throw new Error(`Backend geocoding failed: ${response.status}`);
      }

      const data = await response.json();

      // Backend only provides ADDRESS - use clicked/GPS coords for positioning
      // Clicked coords are ALWAYS more accurate than cached approximate coords
      const newLocation = {
        address: data.display_name || "Unknown Location",
        lat: lat,
        lng: lng,
      };

      setLocation(newLocation);

      // Save as last known location for other parts of the app
      try {
        localStorage.setItem(
          'lastLocation',
          JSON.stringify({ address: data.display_name || 'Unknown Location', lat, lng })
        );
        // Cache location in history
        await addLocationHistory({
          latitude: lat,
          longitude: lng,
          address: data.display_name || 'Unknown Location'
        });

        // Save to recent locations
        await saveRecentLocation(newLocation);

        // Update recent locations list
        const updated = await loadRecentLocations();
        setRecentLocations(updated);
      } catch (e) {
        // Ignore storage errors
      }
      toast.success("Location updated");
    } catch (error) {
      console.error("Error fetching address:", error);
      // Still update coordinates
      setLocation(prev => ({ ...prev, lat, lng, address: "Selected Location" }));
      try {
        localStorage.setItem(
          'lastLocation',
          JSON.stringify({ address: 'Selected Location', lat, lng })
        );
      } catch (e) { }
      toast.error("Failed to fetch address. Please check backend connection.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        updateLocation(latitude, longitude);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Failed to get current location");
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };



  const handleConfirm = async () => {
    // Persist chosen location and return to report form
    try {
      localStorage.setItem('lastLocation', JSON.stringify({ address: location.address, lat: location.lat, lng: location.lng }));
      // Cache location in history
      await addLocationHistory({
        latitude: location.lat,
        longitude: location.lng,
        address: location.address
      });
    } catch (e) { }
    navigate("/report", {
      state: {
        ...previousFormData,
        location: location.address,
        latitude: location.lat,  // Use 'latitude' to match database schema
        longitude: location.lng   // Use 'longitude' to match database schema
      }
    });
  };

  return (
    <div className="mobile-container min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background z-20 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 -ml-1.5 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft size={22} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Choose Location</h1>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search address or landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => {
              // Delay hiding to allow clicking on dropdown items
              setTimeout(() => setShowDropdown(false), 200);
            }}
            className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {(isLoading || isSearching) && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <Loader2 size={18} className="animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Dropdown for Recent Locations or Search Suggestions */}
        {showDropdown && (
          <div className="absolute left-0 right-0 mx-4 top-full -mt-[1px] bg-background border border-t-0 border-border rounded-b-xl shadow-lg max-h-64 overflow-y-auto z-50">
            {/* Show Recent Locations when search is empty */}
            {searchQuery.trim() === '' && recentLocations.length > 0 && (
              <div className="py-1">
                {recentLocations.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectLocation(item)}
                    className="w-full px-3 py-2.5 flex items-start gap-2.5 hover:bg-muted/50 transition-colors text-left first:rounded-t-xl last:rounded-b-xl"
                  >
                    <Clock size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">{item.address}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Show "No recent locations" message */}
            {searchQuery.trim() === '' && recentLocations.length === 0 && (
              <div className="py-6 px-3 text-center text-sm text-muted-foreground">
                No recent locations
              </div>
            )}

            {/* Show Searching indicator */}
            {searchQuery.trim().length >= 3 && isSearching && (
              <div className="py-6 px-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                <span>Searching...</span>
              </div>
            )}

            {/* Show Search Suggestions when query length >= 3 */}
            {searchQuery.trim().length >= 3 && !isSearching && suggestions.length > 0 && (
              <div className="py-1">
                {suggestions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectLocation(item)}
                    className="w-full px-3 py-2.5 flex items-start gap-2.5 hover:bg-muted/50 transition-colors text-left first:rounded-t-xl last:rounded-b-xl"
                  >
                    <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">{item.address}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Show "No results" when searching but no suggestions */}
            {searchQuery.trim().length >= 3 && !isSearching && suggestions.length === 0 && (
              <div className="py-6 px-3 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="relative flex-1 bg-muted min-h-[45vh] w-full z-0">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ width: '100%', height: '100%', position: 'absolute' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationMarker onLocationSelect={updateLocation} />
          <RecenterMap lat={location.lat} lng={location.lng} />

          <Marker position={[location.lat, location.lng]} />
        </MapContainer>

        {/* Current Location Button */}
        <button
          onClick={handleCurrentLocation}
          className="absolute bottom-4 right-4 w-11 h-11 bg-background rounded-full shadow-lg flex items-center justify-center hover:bg-muted transition-colors z-[1000]"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin text-primary" />
          ) : (
            <LocateFixed size={20} className="text-primary" />
          )}
        </button>
      </div>

      {/* Location Info */}
      <div className="px-4 py-2.5 bg-background">
        <p className="text-[10px] text-muted-foreground text-center mb-2">
          Tap on map or search location
        </p>

        <div className="bg-card rounded-lg p-2 shadow-sm border border-border mb-2.5">
          <div className="flex items-start gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <LocateFixed size={12} className="text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground line-clamp-2 leading-tight">{location.address}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pl-8">
            <span>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
            <span className="text-primary font-medium">High Accuracy</span>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="bg-primary text-primary-foreground font-semibold py-2 px-5 rounded-lg w-full transition-all active:scale-[0.98] text-xs"
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
};

export default ChooseLocation;

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BottomNav from "@/components/BottomNav";
import SwipeWrapper from "@/components/SwipeWrapper";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cacheMapReports, getCachedMapReports } from "@/services/offlineService";

// Backend URL - REQUIRED for geocoding
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://civiclens-r87i.onrender.com';

// Fix for default Leaflet marker icons in React/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom icons for severity
// Custom icons for severity using pure CSS (L.divIcon)
const getSeverityIcon = (severity: string) => {
  let colorClass = "bg-green-500 shadow-green-500/50";
  if (severity === "High") colorClass = "bg-red-500 shadow-red-500/50";
  else if (severity === "Medium") colorClass = "bg-amber-500 shadow-amber-500/50";

  // Slightly larger icon for better visibility on mobile
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="${colorClass} w-8 h-8 rounded-full border-2 border-white shadow-lg pulse-marker"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14]
  });
};

// Geocode a location name using ONLY backend API
const geocodeLocation = async (location: string) => {
  if (!location) return null;
  try {
    // Use cached result to avoid repeated requests
    const cacheKey = `geocode:${location}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);

    // ONLY call backend API - no fallback to Nominatim
    const response = await fetch(
      `${BACKEND_URL}/api/search-location?q=${encodeURIComponent(location)}`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) {
      console.warn('Backend geocode failed:', response.status);
      return null;
    }

    const json = await response.json();
    if (Array.isArray(json) && json.length > 0) {
      const lat = parseFloat(json[0].lat);
      const lon = parseFloat(json[0].lon);
      const result = { lat, lon };
      try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch (e) { }
      return result;
    }
  } catch (e) {
    console.warn('Geocode failed for', location, e);
  }
  return null;
};

// Component to handle user location and zoom
const UserLocationHandler = ({ userLocation }: { userLocation: { lat: number, lng: number } | null }) => {
  const map = useMap();

  useEffect(() => {
    // Set zoom limits
    map.setMinZoom(4); // Allow state/province level view, prevent excessive zoom out
    map.setMaxZoom(18); // Maximum zoom level
  }, [map]);

  useEffect(() => {
    if (userLocation) {
      // Fly to user location with full zoom
      map.flyTo([userLocation.lat, userLocation.lng], 16, {
        duration: 1.5
      });
    }
  }, [userLocation, map]);

  return null;
};

const defaultCenter: [number, number] = [20.5937, 78.9629]; // India

const MapView = () => {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const locationRequested = useRef(false);

  // Request user location on mount
  useEffect(() => {
    const requestUserLocation = () => {
      // Prevent duplicate location requests
      if (locationRequested.current) return;
      locationRequested.current = true;

      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationPermissionDenied(false);
          // Removed duplicate toast notification
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationPermissionDenied(true);

          if (error.code === error.PERMISSION_DENIED) {
            toast.error("Please enable location services to see nearby issues", {
              duration: 5000,
              action: {
                label: "Settings",
                onClick: () => {
                  toast.info("Please enable location in your browser settings");
                }
              }
            });
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            toast.error("Location information is unavailable");
          } else if (error.code === error.TIMEOUT) {
            toast.error("Location request timed out");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    };

    requestUserLocation();
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);

        if (isOnline) {
          const { data, error } = await supabase
            .from('reports')
            .select('id, title, category, severity, latitude, longitude, created_at, status, location_name')
            .not("latitude", "is", null)
            .not("longitude", "is", null)
            .eq('status', 'pending') // Only show pending reports so markers match Nearby issues
            .order('created_at', { ascending: false })
            .limit(100); // Limit to 100 markers for performance

          if (data) {
            const prepared: any[] = [];

            // First pass: use reports that already have coordinates
            for (const report of data) {
              if (report.latitude && report.longitude) {
                prepared.push({
                  id: report.id,
                  lat: parseFloat(report.latitude),
                  lng: parseFloat(report.longitude),
                  type: report.category,
                  severity: report.severity ? (report.severity.charAt(0).toUpperCase() + report.severity.slice(1)) : 'Medium',
                  title: report.title,
                  originalData: report
                });
              }
            }

            // For reports without coords, attempt geocoding for a limited number to avoid rate limits
            const toGeocode = data.filter(r => !(r.latitude && r.longitude)).slice(0, 10);
            for (const report of toGeocode) {
              const locName = report.location_name || '';
              const geo = await geocodeLocation(locName);
              if (geo) {
                prepared.push({
                  id: report.id,
                  lat: geo.lat,
                  lng: geo.lon,
                  type: report.category,
                  severity: report.severity ? (report.severity.charAt(0).toUpperCase() + report.severity.slice(1)) : 'Medium',
                  title: report.title + (locName ? ` — ${locName}` : ''),
                  originalData: report
                });
              }
            }

            setMarkers(prepared);

            // Cache for offline use  
            await cacheMapReports(data);
          }
        } else {
          // Load from cache when offline
          const cachedData = await getCachedMapReports();
          if (cachedData.length > 0) {
            const prepared: any[] = [];

            // Show only reports with coordinates from cache
            for (const report of cachedData) {
              if (report.latitude && report.longitude && report.status === 'pending') {
                prepared.push({
                  id: report.id,
                  lat: parseFloat(report.latitude),
                  lng: parseFloat(report.longitude),
                  type: report.category,
                  severity: report.severity ? (report.severity.charAt(0).toUpperCase() + report.severity.slice(1)) : 'Medium',
                  title: report.title,
                  originalData: report
                });
              }
            }
            setMarkers(prepared);
          }
        }
      } catch (error) {
        console.error("Error fetching map reports:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [isOnline]);



  return (
    <SwipeWrapper swipeDisabled={true} className="mobile-container h-screen flex flex-col bg-background pb-20">
      {/* Map Area */}
      <div className="relative flex-1 w-full z-0">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-sm font-medium text-muted-foreground">Loading reports...</span>
            </div>
          </div>
        )}

        <MapContainer
          center={defaultCenter}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <UserLocationHandler userLocation={userLocation} />

          {/* Markers */}
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={getSeverityIcon(marker.severity)}
              eventHandlers={{
                click: () => {
                  // Navigate directly to the report details when a marker is clicked
                  navigate(`/report-details/${marker.id}`);
                },
              }}
            />
          ))}

        </MapContainer>

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-card rounded-xl p-3 shadow-lg z-[1000]">
          <p className="text-xs font-semibold text-foreground mb-2">Nearby Issues</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-xs text-muted-foreground">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <span className="text-xs text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-xs text-muted-foreground">Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Details Panel */}
      {selectedIssue && (
        <div className="absolute bottom-20 left-0 right-0 bg-card rounded-t-3xl shadow-2xl p-6 animate-slide-up z-10">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedIssue.severity === "High" ? "bg-red-100" :
              selectedIssue.severity === "Medium" ? "bg-amber-100" : "bg-green-100"
              }`}>
              <AlertTriangle size={24} className={
                selectedIssue.severity === "High" ? "text-red-500" :
                  selectedIssue.severity === "Medium" ? "text-amber-500" : "text-green-500"
              } />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{selectedIssue.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${selectedIssue.severity === "High" ? "severity-high" :
                selectedIssue.severity === "Medium" ? "severity-medium" : "severity-low"
                }`}>
                {selectedIssue.severity}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/report-details/${selectedIssue.id}`)}
            className="btn-primary mt-4"
          >
            View Details
          </button>
        </div>
      )}

      <BottomNav />
    </SwipeWrapper>
  );
};

export default MapView;

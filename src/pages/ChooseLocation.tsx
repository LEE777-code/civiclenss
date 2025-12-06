import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search, LocateFixed, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

  const updateLocation = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();

      setLocation({
        address: data.display_name || "Unknown Location",
        lat: lat,
        lng: lng,
      });
      toast.success("Location updated");
    } catch (error) {
      console.error("Error fetching address:", error);
      // Still update coordinates
      setLocation(prev => ({ ...prev, lat, lng, address: "Selected Location" }));
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
      }
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);

        setLocation({
          address: result.display_name,
          lat: newLat,
          lng: newLng,
        });

        toast.success("Location found");
      } else {
        toast.error("Location not found");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      toast.error("Failed to search location");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    navigate("/report", {
      state: {
        ...previousFormData,
        location: location.address,
        lat: location.lat,
        lng: location.lng
      }
    });
  };

  return (
    <div className="mobile-container min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background z-20 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Choose Location</h1>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-4 z-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search address or landmark..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="input-field pl-12 pr-12"
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          )}
        </div>
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
          className="absolute bottom-4 right-4 w-12 h-12 bg-background rounded-full shadow-lg flex items-center justify-center hover:bg-muted transition-colors z-[1000]"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 size={24} className="animate-spin text-primary" />
          ) : (
            <LocateFixed size={24} className="text-primary" />
          )}
        </button>
      </div>

      {/* Location Info */}
      <div className="px-6 py-4 bg-background">
        <p className="text-sm text-muted-foreground text-center mb-4">
          Tap on the map or search to set location
        </p>

        <div className="card-elevated mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <LocateFixed size={16} className="text-primary" />
            </div>
            <span className="font-medium text-foreground line-clamp-2">{location.address}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</span>
            <span className="text-primary font-medium">Accuracy: High</span>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="btn-primary"
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
};

export default ChooseLocation;

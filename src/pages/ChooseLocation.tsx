import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search, MapPin, LocateFixed, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ChooseLocation = () => {
  const navigate = useNavigate();
  const { state: previousFormData } = useLocation(); // Get form data passed from ReportIssue
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState({
    address: "123 Main Street, Anytown",
    lat: 34.0522,
    lng: -118.2437,
  });

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocoding using Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          setLocation({
            address: data.display_name || "Unknown Location",
            lat: latitude,
            lng: longitude,
          });
          toast.success("Location updated to current position");
        } catch (error) {
          console.error("Error fetching address:", error);
          toast.error("Failed to fetch address details");
        } finally {
          setIsLoading(false);
        }
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
        setLocation({
          address: result.display_name,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
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
    // Navigate back to ReportIssue with updated location and preserved form data
    navigate("/report", {
      state: {
        ...previousFormData,
        location: location.address,
        // We could also pass lat/lng if needed in the future
      }
    });
  };

  return (
    <div className="mobile-container min-h-screen bg-background">
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
      <div className="px-6 py-4">
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

      {/* Map Placeholder */}
      <div className="relative h-[45vh] bg-muted">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-primary/10 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
              <MapPin size={32} className="text-primary-foreground" />
            </div>
            <div className="bg-background rounded-xl px-4 py-2 shadow-lg max-w-xs mx-auto">
              <p className="font-medium text-foreground text-sm line-clamp-2">{location.address}</p>
            </div>
          </div>
        </div>

        {/* Current Location Button */}
        <button
          onClick={handleCurrentLocation}
          className="absolute bottom-4 right-4 w-12 h-12 bg-background rounded-full shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
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
      <div className="px-6 py-4">
        <p className="text-sm text-muted-foreground text-center mb-4">
          Search or use current location to set the address
        </p>

        <div className="card-elevated mb-4">
          <div className="flex items-center gap-3 mb-2">
            <MapPin size={20} className="text-primary shrink-0" />
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

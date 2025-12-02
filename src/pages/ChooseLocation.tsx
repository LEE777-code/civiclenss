import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, MapPin, Navigation } from "lucide-react";

const ChooseLocation = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useState({
    address: "123 Main Street, Anytown",
    lat: 34.0522,
    lng: -118.2437,
  });

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
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="relative h-[45vh] bg-muted">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-primary/10 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
              <MapPin size={32} className="text-primary-foreground" />
            </div>
            <div className="bg-background rounded-xl px-4 py-2 shadow-lg">
              <p className="font-medium text-foreground text-sm">{location.address}</p>
            </div>
          </div>
        </div>
        
        {/* Current Location Button */}
        <button className="absolute bottom-4 right-4 w-12 h-12 bg-background rounded-full shadow-lg flex items-center justify-center">
          <Navigation size={24} className="text-primary" />
        </button>
      </div>

      {/* Location Info */}
      <div className="px-6 py-4">
        <p className="text-sm text-muted-foreground text-center mb-4">
          Drag the map to adjust location
        </p>

        <div className="card-elevated mb-4">
          <div className="flex items-center gap-3 mb-2">
            <MapPin size={20} className="text-primary" />
            <span className="font-medium text-foreground">{location.address}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Lat: {location.lat}, Lng: {location.lng}</span>
            <span className="text-primary font-medium">Accuracy: High</span>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="btn-primary"
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
};

export default ChooseLocation;

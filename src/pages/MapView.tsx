import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BottomNav from "@/components/BottomNav";
import SwipeWrapper from "@/components/SwipeWrapper";
import { supabase } from "@/lib/supabase";

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

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="${colorClass} w-6 h-6 rounded-full border-2 border-white shadow-lg pulse-marker"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Component to fit bounds
const FitBoundsEvents = ({ markers }: { markers: any[] }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const valid = markers.filter(m => m.lat && m.lng);
      if (valid.length > 0) {
        const bounds = L.latLngBounds(valid.map(m => [m.lat, m.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      // Try to locate user if no markers
      map.locate({ setView: true, maxZoom: 16 });
    }
  }, [markers, map]);
  return null;
};

const defaultCenter: [number, number] = [20.5937, 78.9629]; // India

const MapView = () => {
  const navigate = useNavigate();
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          // .eq('status', 'pending') // Temporarily show ALL reports for debugging
          .order('created_at', { ascending: false })
          .limit(50); // Fetch more than Home (5) to populate the map well

        if (data) {
          const validMarkers = data
            .filter(r => r.latitude && r.longitude)
            .map((report) => ({
              id: report.id,
              lat: parseFloat(report.latitude),
              lng: parseFloat(report.longitude),
              type: report.category,
              severity: report.severity.charAt(0).toUpperCase() + report.severity.slice(1),
              title: report.title,
              originalData: report
            }));
          setMarkers(validMarkers);
        }
      } catch (error) {
        console.error("Error fetching map reports:", error);
      }
    };

    fetchReports();
  }, []);

  // Debug logs
  useEffect(() => {
    console.log("Current Markers State:", markers);
  }, [markers]);

  return (
    <SwipeWrapper className="mobile-container h-screen flex flex-col bg-background pb-20">
      {/* Map Area */}
      <div className="relative flex-1 w-full z-0">
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

          <FitBoundsEvents markers={markers} />

          {/* Markers */}
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={getSeverityIcon(marker.severity)}
              eventHandlers={{
                click: () => {
                  setSelectedIssue(marker);
                },
              }}
            >
            </Marker>
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

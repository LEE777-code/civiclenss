import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, AlertTriangle, ChevronUp } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import SwipeWrapper from "@/components/SwipeWrapper";

const markers = [
  { id: 1, lat: 30, lng: 40, type: "pothole", severity: "High" },
  { id: 2, lat: 50, lng: 60, type: "streetlight", severity: "Medium" },
  { id: 3, lat: 70, lng: 30, type: "graffiti", severity: "Low" },
];

const MapView = () => {
  const navigate = useNavigate();
  const [selectedIssue, setSelectedIssue] = useState<typeof markers[0] | null>(null);

  return (
    <SwipeWrapper className="mobile-container min-h-screen bg-background pb-20">
      {/* Map Area */}
      <div className="relative h-[70vh] bg-gradient-to-br from-primary/5 to-primary/10">
        {/* Simulated Map */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {/* Grid pattern to simulate map */}
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Markers */}
          {markers.map((marker) => (
            <button
              key={marker.id}
              onClick={() => setSelectedIssue(marker)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-pulse-soft"
              style={{ left: `${marker.lng}%`, top: `${marker.lat}%` }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${marker.severity === "High" ? "bg-red-500" :
                  marker.severity === "Medium" ? "bg-amber-500" : "bg-green-500"
                }`}>
                <AlertTriangle size={20} className="text-primary-foreground" />
              </div>
            </button>
          ))}

          {/* Current Location */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-primary-foreground shadow-lg" />
            <div className="w-12 h-12 bg-blue-500/20 rounded-full absolute -inset-4 animate-ping" />
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-card rounded-xl p-3 shadow-lg">
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
        <div className="absolute bottom-20 left-0 right-0 bg-card rounded-t-3xl shadow-2xl p-6 animate-slide-up">
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
              <h3 className="font-semibold text-foreground">Graffiti on Wall</h3>
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

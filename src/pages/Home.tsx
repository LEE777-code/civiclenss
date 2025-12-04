import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Sun, FileText, List, Bell, Map, ChevronRight, AlertTriangle, Lightbulb, Cloud, CloudRain, CloudSnow, CloudLightning } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import BottomNav from "@/components/BottomNav";
import SwipeWrapper from "@/components/SwipeWrapper";
import { getWeather, WeatherData } from "@/services/WeatherService";

import { supabase } from "@/lib/supabase";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [nearbyIssues, setNearbyIssues] = useState<any[]>([]);
  const [reportCounts, setReportCounts] = useState({ pending: 0, resolved: 0 });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        // Fetch nearby issues
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (data) {
          setNearbyIssues(data.map(report => ({
            id: report.id,
            title: report.title,
            severity: report.severity.charAt(0).toUpperCase() + report.severity.slice(1),
            location: report.location_name || "Unknown Location",
            distance: "0.5 mi away", // Placeholder for now
            icon: report.category === 'Streetlight / Electricity' ? Lightbulb : AlertTriangle, // Simple logic for icon
          })));
        }

        // Fetch counts
        const { count: pendingCount } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        const { count: resolvedCount } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'resolved');

        setReportCounts({
          pending: pendingCount || 0,
          resolved: resolvedCount || 0
        });

      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };

    fetchReports();
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Coordinates for Anna Nagar, Chennai
        const data = await getWeather(13.0850, 80.2101);
        if (data) {
          setWeather(data);
        } else {
          setError("Unavailable");
        }
      } catch (err) {
        setError("Error");
      }
    };
    fetchWeather();
  }, []);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clouds": return <Cloud size={20} />;
      case "rain": return <CloudRain size={20} />;
      case "snow": return <CloudSnow size={20} />;
      case "thunderstorm": return <CloudLightning size={20} />;
      default: return <Sun size={20} />;
    }
  };

  const quickActions = [
    { icon: FileText, label: "Report an Issue", desc: "Submit a new report", path: "/report", color: "bg-primary" },
    { icon: List, label: "My Reports", desc: "Track your submissions", path: "/my-reports", color: "bg-blue-500" },
    { icon: Bell, label: "Nearby Alerts", desc: "See local updates", path: "/alerts", color: "bg-amber-500" },
    { icon: Map, label: "Map View", desc: "Explore issues visually", path: "/map", color: "bg-emerald-500" },
  ];

  return (
    <SwipeWrapper className="mobile-container min-h-screen bg-muted pb-24">
      {/* Header */}
      <div className="bg-primary px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-foreground/80 text-sm">
              Welcome back, {user?.firstName || "Citizen"}!
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground/80">
            <MapPin size={16} />
            <span className="text-sm">{weather ? weather.location : "Anna Nagar, Chennai"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-primary-foreground mb-6">
          {weather ? getWeatherIcon(weather.condition) : <Sun size={20} />}
          <span className="text-sm">
            {weather
              ? `${weather.temp}°C ${weather.condition}`
              : error
                ? "Weather Unavailable (Check API Key)"
                : "Loading..."}
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search issues, categories, updates..."
            className="w-full bg-background rounded-xl pl-12 pr-4 py-3 text-sm placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Quick Actions */}
      {!searchQuery && (
        <div className="px-6 -mt-4">
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="card-elevated flex flex-col items-start p-4 text-left animate-fade-in"
              >
                <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center mb-3`}>
                  <action.icon size={20} className="text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground text-sm">{action.label}</span>
                <span className="text-muted-foreground text-xs mt-0.5">{action.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Updates */}
      {!searchQuery && (
        <div className="px-6 mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Recent Updates</h2>
          <div className="flex gap-3">
            <div className="flex-1 card-elevated">
              <div className="text-2xl font-bold text-amber-500">{reportCounts.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="flex-1 card-elevated">
              <div className="text-2xl font-bold text-emerald-500">{reportCounts.resolved}</div>
              <div className="text-sm text-muted-foreground">Resolved</div>
            </div>
          </div>
        </div>
      )}

      {/* Latest Issues Near You */}
      <div className="px-6 mt-6">
        <h2 className="text-lg font-bold text-foreground mb-3">Latest Issues Near You</h2>
        <div className="space-y-3">
          {nearbyIssues
            .filter(issue =>
              issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              issue.severity.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((issue) => (
              <button
                key={issue.id}
                onClick={() => navigate(`/report-details/${issue.id}`)}
                className="card-elevated w-full flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${issue.severity === "High" ? "bg-red-100" : "bg-amber-100"
                  }`}>
                  <issue.icon size={24} className={
                    issue.severity === "High" ? "text-red-500" : "text-amber-500"
                  } />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-foreground text-sm">{issue.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${issue.severity === "High" ? "severity-high" : "severity-medium"
                      }`}>
                      {issue.severity}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {issue.location} · {issue.distance}
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-muted-foreground" />
              </button>
            ))}
          {nearbyIssues.filter(issue =>
            issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.severity.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No issues found matching "{searchQuery}"
              </div>
            )}
        </div>
      </div>

      <BottomNav />
    </SwipeWrapper>
  );
};

export default Home;

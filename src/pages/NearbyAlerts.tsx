import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, ArrowUpDown, Check } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { getCategoryIcon } from "@/utils/categoryIcons";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cacheNearbyAlerts, getCachedNearbyAlerts } from "@/services/offlineService";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

const NearbyAlerts = () => {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [allAlerts, setAllAlerts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortOption, setSortOption] = useState("latest");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      console.log('🔍 NearbyAlerts: fetchAlerts called, isOnline:', isOnline);
      try {
        if (isOnline) {
          console.log('🌐 NearbyAlerts: Fetching from Supabase...');
          const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20); // Fetch last 20 reports as alerts

          console.log('📊 NearbyAlerts: Received data:', data?.length, 'reports');
          if (data) {
            setAllAlerts(data.map(report => ({
              id: report.id,
              title: report.title,
              description: report.description || `${report.location_name} · 0.5 mi away`,
              time: new Date(report.created_at).toLocaleDateString(),
              category: report.category,
              icon: getCategoryIcon(report.category || "Other"),
              color: report.severity === 'high' ? "bg-red-100" : "bg-amber-100",
              iconColor: report.severity === 'high' ? "text-red-500" : "text-amber-500",
              severity: report.severity.charAt(0).toUpperCase() + report.severity.slice(1),
              status: report.status.charAt(0).toUpperCase() + report.status.slice(1),
              upvotes: report.upvotes || 0,
              type: "Issue"
            })));

            // Cache for offline use
            await cacheNearbyAlerts(data);
          }
        } else {
          // Load from cache when offline
          const cachedData = await getCachedNearbyAlerts();
          if (cachedData.length > 0) {
            setAllAlerts(cachedData.slice(0, 20).map((report: any) => ({
              id: report.id,
              title: report.title,
              description: report.description || `${report.location_name} · 0.5 mi away`,
              time: new Date(report.created_at).toLocaleDateString(),
              category: report.category,
              icon: getCategoryIcon(report.category || "Other"),
              color: report.severity === 'high' ? "bg-red-100" : "bg-amber-100",
              iconColor: report.severity === 'high' ? "text-red-500" : "text-amber-500",
              severity: report.severity.charAt(0).toUpperCase() + report.severity.slice(1),
              status: report.status.charAt(0).toUpperCase() + report.status.slice(1),
              upvotes: report.upvotes || 0,
              type: "Issue"
            })));
          }
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchAlerts();
  }, [isOnline]);

  const toggleFilter = (list: string[], item: string, setList: (l: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const filteredAlerts = allAlerts
    .filter((alert) => {
      const matchesSearch =
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Map alert statuses to filter statuses if needed, or just use raw strings
      // For simplicity, we'll filter by what's present in the data
      const matchesStatus = filterStatus.length === 0 || filterStatus.includes(alert.status);
      const matchesSeverity = filterSeverity.length === 0 || filterSeverity.includes(alert.severity);

      return matchesSearch && matchesStatus && matchesSeverity;
    })
    .sort((a, b) => {
      if (sortOption === "latest") {
        // Simple string comparison for "xh ago" isn't perfect but works for this mock data if we assume order
        // For better sorting, we'd need real timestamps. 
        // Let's just use ID as a proxy for recency for now or keep original order
        return a.id - b.id; // Placeholder for date sort
      } else if (sortOption === "priority-high-low") {
        const severityOrder = { High: 3, Medium: 2, Low: 1 };
        return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - (severityOrder[a.severity as keyof typeof severityOrder] || 0);
      } else if (sortOption === "priority-low-high") {
        const severityOrder = { High: 3, Medium: 2, Low: 1 };
        return (severityOrder[a.severity as keyof typeof severityOrder] || 0) - (severityOrder[b.severity as keyof typeof severityOrder] || 0);
      }
      return 0;
    });

  return (
    <div className="mobile-container min-h-screen bg-muted pb-24 relative">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Nearby Alerts</h1>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search alerts, issues..."
            className="input-field pl-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter & Sort Buttons */}
        <div className="flex gap-3 mb-4 relative z-20">
          <div className="flex-1 relative">
            <button
              className={`w-full btn-secondary flex items-center justify-center gap-2 py-2.5 ${showSortMenu ? 'bg-primary/10 text-primary border-primary/20' : ''}`}
              onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
            >
              <ArrowUpDown size={18} className="text-inherit" />
              <span className="text-inherit">Sort</span>
            </button>

            {/* Sort Menu */}
            {showSortMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-background rounded-xl shadow-lg border border-border p-2 animate-in fade-in zoom-in-95 duration-200 z-30">
                {[
                  { label: "Latest", value: "latest" },
                  { label: "Priority (High to Low)", value: "priority-high-low" },
                  { label: "Priority (Low to High)", value: "priority-low-high" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setSortOption(option.value); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm flex items-center justify-between ${sortOption === option.value ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                      }`}
                  >
                    {option.label}
                    {sortOption === option.value && <Check size={16} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            <button
              className={`w-full btn-secondary flex items-center justify-center gap-2 py-2.5 ${showFilterMenu ? 'bg-primary/10 text-primary border-primary/20' : ''}`}
              onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
            >
              <Filter size={18} className="text-inherit" />
              <span className="text-inherit">Filter</span>
              {(filterStatus.length > 0 || filterSeverity.length > 0) && (
                <span className="bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center ml-1">
                  {filterStatus.length + filterSeverity.length}
                </span>
              )}
            </button>

            {/* Filter Menu */}
            {showFilterMenu && (
              <div className="absolute top-full right-0 w-64 mt-2 bg-background rounded-xl shadow-lg border border-border p-4 animate-in fade-in zoom-in-95 duration-200 z-30">
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Status</h3>
                  <div className="space-y-2">
                    {["Pending", "In Progress", "Resolved"].map((status) => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${filterStatus.includes(status) ? "bg-primary border-primary" : "border-muted-foreground"
                          }`}>
                          {filterStatus.includes(status) && <Check size={12} className="text-primary-foreground" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={filterStatus.includes(status)}
                          onChange={() => toggleFilter(filterStatus, status, setFilterStatus)}
                        />
                        <span className="text-sm text-foreground">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Severity</h3>
                  <div className="space-y-2">
                    {["Low", "Medium", "High"].map((severity) => (
                      <label key={severity} className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${filterSeverity.includes(severity) ? "bg-primary border-primary" : "border-muted-foreground"
                          }`}>
                          {filterSeverity.includes(severity) && <Check size={12} className="text-primary-foreground" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={filterSeverity.includes(severity)}
                          onChange={() => toggleFilter(filterSeverity, severity, setFilterSeverity)}
                        />
                        <span className="text-sm text-foreground">{severity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex justify-end">
                  <button
                    onClick={() => { setFilterStatus([]); setFilterSeverity([]); }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overlay to close menus when clicking outside */}
        {(showSortMenu || showFilterMenu) && (
          <div
            className="fixed inset-0 z-10 bg-black/5"
            onClick={() => { setShowSortMenu(false); setShowFilterMenu(false); }}
          />
        )}

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert, index) => (
              <div
                key={alert.id}
                className="card-elevated animate-fade-in cursor-pointer hover:shadow-lg transition-all duration-300 h-[88px] flex items-center"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(`/report-details/${alert.id}`)}
              >
                <div className="flex gap-4 w-full">
                  <div className={`w-12 h-12 flex-shrink-0 ${alert.color} rounded-xl flex items-center justify-center`}>
                    <alert.icon size={24} className={alert.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground text-sm truncate mb-1">{alert.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${alert.severity === "High" ? "bg-red-100 text-red-600" :
                        alert.severity === "Medium" ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                        }`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground truncate">Time: {alert.time}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{alert.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No alerts found matching your criteria.</p>
              <button
                onClick={() => { setSearchQuery(""); setFilterStatus([]); setFilterSeverity([]); }}
                className="text-primary text-sm font-medium mt-2 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default NearbyAlerts;

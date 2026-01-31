import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, ArrowUpDown, Check, X, Download } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { getCategoryIcon } from "@/utils/categoryIcons";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cacheMyReports, getCachedMyReports } from "@/services/offlineService";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { generateReportPDF, downloadPDF } from "@/services/pdfService";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const MyReports = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();
  const [reports, setReports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortOption, setSortOption] = useState("latest");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string[]>([]);

  const fetchMyReports = async () => {
    // Fetch user's reports from Supabase or cache
    // Get user ID from Clerk or localStorage (anonymous)
    let userId = user?.id;
    if (!userId) {
      userId = localStorage.getItem('anonymous_user_id');
    }

    if (!userId) {
      console.log('No user ID found');
      // When offline and no user ID, show cached reports
      if (!isOnline) {
        const cachedData = await getCachedMyReports();
        if (cachedData.length > 0) {
          setReports(cachedData.map((report: any) => ({
            id: report.id,
            title: report.title,
            status: report.status.charAt(0).toUpperCase() + report.status.slice(1),
            severity: report.severity.charAt(0).toUpperCase() + report.severity.slice(1),
            category: report.category,
            location: report.location_name || "Unknown Location",
            date: new Date(report.created_at).toLocaleDateString(),
            image: report.image_url,
            resolved_image_url: report.resolved_image_url,
            description: report.description,
            createdAt: report.created_at,
            upvotes: report.upvotes || 0,
            icon: getCategoryIcon(report.category || "Other"),
          })));
        }
      }
      return;
    }

    try {
      if (isOnline) {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from("reports")
          .select('id, title, status, severity, category, location_name, created_at, image_url, resolved_image_url, description, upvotes')
          .eq("user_id", user.id)
          .order('created_at', { ascending: false })
          .limit(50); // Limit to 50 most recent user reports

        if (error) {
          console.error('Error fetching reports:', error);
          return;
        }


        if (data) {
          setReports(data.map(report => ({
            id: report.id,
            title: report.title,
            status: report.status.charAt(0).toUpperCase() + report.status.slice(1),
            severity: report.severity.charAt(0).toUpperCase() + report.severity.slice(1),
            category: report.category,
            location: report.location_name || "Unknown Location",
            date: new Date(report.created_at).toLocaleDateString(),
            image: report.image_url,
            resolved_image_url: report.resolved_image_url,
            description: report.description,
            createdAt: report.created_at,
            upvotes: report.upvotes || 0,
            icon: getCategoryIcon(report.category || "Other"),
          })));

          // Cache for offline use
          await cacheMyReports(data);
        }
      } else {
        // Load from cache when offline - show all cached reports
        // Note: We can't filter by user_id offline without storing it in cache
        const cachedData = await getCachedMyReports();
        if (cachedData.length > 0) {
          setReports(cachedData.map((report: any) => ({
            id: report.id,
            title: report.title,
            status: report.status.charAt(0).toUpperCase() + report.status.slice(1),
            severity: report.severity.charAt(0).toUpperCase() + report.severity.slice(1),
            category: report.category,
            location: report.location_name || "Unknown Location",
            date: new Date(report.created_at).toLocaleDateString(),
            image: report.image_url,
            resolved_image_url: report.resolved_image_url,
            description: report.description,
            createdAt: report.created_at,
            upvotes: report.upvotes || 0,
            icon: getCategoryIcon(report.category || "Other"),
          })));
        }
      }
    } catch (error) {
      console.error("Error fetching my reports:", error);
    }
  };

  useEffect(() => {
    fetchMyReports();

    // Set up real-time subscription only when online
    if (isOnline) {
      const channel = supabase
        .channel('my-reports')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reports',
          },
          () => {
            fetchMyReports();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isOnline]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Resolved":
        return "status-resolved";
      case "Rejected":
        return "status-rejected";
      case "Pending":
        return "status-pending";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const toggleFilter = (list: string[], item: string, setList: (l: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleDownloadPDF = async (report: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to details

    try {
      toast.info("Generating PDF...");
      // Reverted to client-side PDF generation
      // We need to map the report object correctly to what generateReportPDF expects if there are differences
      // But based on previous code, we can pass report directly or map it.
      // Looking at pdfService, it expects ReportData.

      const reportData = {
        id: report.id,
        title: report.title,
        status: report.status,
        severity: report.severity,
        location: report.location,
        description: report.description,
        date: report.date,
        createdAt: report.createdAt,
        category: report.category,
        image: report.image,
        resolved_image_url: report.resolved_image_url
      };

      const pdfBlob = await generateReportPDF(reportData);
      downloadPDF(pdfBlob, `CivicLens_Report_${report.id.substring(0, 8)}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const filteredReports = reports
    .filter((report) => {
      const matchesSearch =
        (report.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (report.category || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus.length === 0 || filterStatus.includes(report.status);
      const matchesSeverity = filterSeverity.length === 0 || filterSeverity.includes(report.severity);
      return matchesSearch && matchesStatus && matchesSeverity;
    })
    .sort((a, b) => {
      if (sortOption === "latest") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
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
          <h1 className="text-xl font-bold text-foreground">{t("myReports.title")}</h1>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder={t("myReports.search")}
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
              <span className="text-inherit">{t("myReports.sort")}</span>
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
              <span className="text-inherit">{t("myReports.filter")}</span>
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
                    {["Resolved", "Rejected", "Pending"].map((status) => (
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

        {/* Reports List */}
        <div className="space-y-3">
          {filteredReports.length > 0 ? (
            filteredReports.map((report, index) => (
              <div
                key={report.id}
                className="card-elevated w-full animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <button
                  onClick={() => navigate(`/report-details/${report.id}`)}
                  className="w-full text-left h-[88px] flex items-center"
                >
                  <div className="flex gap-4 w-full">
                    <div className="w-12 h-12 flex-shrink-0 bg-primary/10 rounded-xl flex items-center justify-center">
                      <report.icon size={24} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground text-sm truncate">{report.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${getStatusStyle(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{report.category}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className={`text-xs font-medium ${report.severity === "High" ? "text-red-500" :
                          report.severity === "Medium" ? "text-amber-500" : "text-green-500"
                          }`}>
                          {report.severity} Priority
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {report.location} • {report.date}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Download button */}
                <div className="flex justify-end mt-3 pt-3 border-t border-border">
                  <button
                    onClick={(e) => handleDownloadPDF(report, e)}
                    className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <Download size={16} />
                    Download PDF
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No reports found matching your criteria.</p>
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

export default MyReports;

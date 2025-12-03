import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, ArrowUpDown, Lightbulb, Trash2, Paintbrush } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const reports = [
  {
    id: 1,
    title: "Broken Streetlight at Elm & 2nd",
    status: "Resolved",
    category: "Streetlight Out",
    location: "Oakland, CA",
    date: "June 12, 2024",
    icon: Lightbulb,
  },
  {
    id: 2,
    title: "Graffiti on Park Wall",
    status: "Rejected",
    category: "Graffiti",
    location: "Oakland, CA",
    date: "May 28, 2024",
    icon: Paintbrush,
  },
  {
    id: 3,
    title: "Overflowing Bin at Plaza",
    status: "Pending",
    category: "Waste",
    location: "Oakland, CA",
    date: "May 25, 2024",
    icon: Trash2,
  },
];

const MyReports = () => {
  const navigate = useNavigate();

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

  return (
    <div className="mobile-container min-h-screen bg-muted pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">My Reports</h1>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Search reports..."
            className="input-field pl-12"
          />
        </div>

        {/* Filter & Sort */}
        <div className="flex gap-3 mb-4">
          <button className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2.5">
            <ArrowUpDown size={18} className="text-inherit" />
            <span className="text-inherit">Sort</span>
          </button>
          <button className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2.5">
            <Filter size={18} className="text-inherit" />
            <span className="text-inherit">Filter</span>
          </button>
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {reports.map((report, index) => (
            <button
              key={report.id}
              onClick={() => navigate(`/report-details/${report.id}`)}
              className="card-elevated w-full text-left animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <report.icon size={24} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-sm">{report.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${getStatusStyle(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{report.category}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {report.location} • {report.date}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default MyReports;

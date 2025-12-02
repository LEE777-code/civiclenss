import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Filter, ArrowUpDown, Zap, Construction, Droplets, TreePine } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const alerts = [
  {
    id: 1,
    title: "Power Outage on Main St",
    description: "Crews are working to restore power, expected resolution by...",
    time: "2h ago",
    icon: Zap,
    color: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    id: 2,
    title: "Road Closure on Elm Ave",
    description: "Scheduled maintenance will close the road between 1st and...",
    time: "1d ago",
    icon: Construction,
    color: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    id: 3,
    title: "Water Main Break Report",
    description: "A water main break has been reported near Oak Street...",
    time: "3d ago",
    icon: Droplets,
    color: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: 4,
    title: "Community Park Cleanup",
    description: "Join us this Saturday at 9 AM for a community-wide park...",
    time: "5d ago",
    icon: TreePine,
    color: "bg-green-100",
    iconColor: "text-green-600",
  },
];

const NearbyAlerts = () => {
  const navigate = useNavigate();

  return (
    <div className="mobile-container min-h-screen bg-muted pb-24">
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
            placeholder="Search issues by title, type..."
            className="input-field pl-12"
          />
        </div>

        {/* Filter & Sort */}
        <div className="flex gap-3 mb-4">
          <button className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2.5">
            <Filter size={18} />
            Filter
          </button>
          <button className="flex-1 btn-secondary flex items-center justify-center gap-2 py-2.5">
            <ArrowUpDown size={18} />
            Sort
          </button>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={alert.id}
              className="card-elevated animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 ${alert.color} rounded-xl flex items-center justify-center shrink-0`}>
                  <alert.icon size={24} className={alert.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">{alert.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{alert.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">Time: {alert.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default NearbyAlerts;

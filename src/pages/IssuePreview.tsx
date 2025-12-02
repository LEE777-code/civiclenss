import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Tag, Eye, Edit, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const IssuePreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = location.state || {
    title: "Large Pothole on Main St",
    description: "Deep pothole causing traffic issues and potential danger to cyclists.",
    location: "123 Main Street, Anytown, USA",
    severity: "High",
    anonymous: true,
  };

  const handleSubmit = () => {
    toast.success("Issue reported successfully!");
    navigate("/home");
  };

  return (
    <div className="mobile-container min-h-screen bg-muted">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Preview</h1>
        </div>
      </div>

      {/* Issue Image Placeholder */}
      <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center">
          <AlertTriangle size={40} className="text-primary" />
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Title & Severity */}
        <div className="card-elevated">
          <h2 className="text-xl font-bold text-foreground mb-2">
            {formData.title || "Large Pothole on Main St"}
          </h2>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">
              Road Damage
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              formData.severity === "High" ? "severity-high" :
              formData.severity === "Medium" ? "severity-medium" : "severity-low"
            }`}>
              {formData.severity} Severity
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="card-elevated">
          <p className="text-muted-foreground">
            {formData.description || "Deep pothole causing traffic issues and potential danger to cyclists."}
          </p>
        </div>

        {/* Details */}
        <div className="card-elevated space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              Location
            </h3>
            <p className="text-muted-foreground text-sm">{formData.location}</p>
            <p className="text-xs text-muted-foreground mt-1">40.7128° N, 74.0060° W</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              Date & Time
            </h3>
            <p className="text-muted-foreground text-sm">Oct 26, 10:45 AM</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Tag size={16} className="text-primary" />
              Category
            </h3>
            <p className="text-muted-foreground text-sm">Road Damage</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Eye size={16} className="text-primary" />
              Report Anonymously
            </h3>
            <p className="text-muted-foreground text-sm">{formData.anonymous ? "Yes" : "No"}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-3">Actions</h3>
          <div className="space-y-2">
            <button onClick={handleSubmit} className="btn-primary">
              Submit Issue
            </button>
            <button onClick={() => navigate(-1)} className="btn-secondary flex items-center justify-center gap-2">
              <Edit size={18} />
              Edit Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuePreview;

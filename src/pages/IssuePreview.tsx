import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Tag, Eye, Edit, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import sampleImage from "@/assets/pages/page_1.jpg";

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
    <div className="mobile-container min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Preview Report</h1>
        </div>
      </div>

      {/* Large Image */}
      <div className="px-6 pt-4">
        <div className="w-full h-64 bg-gradient-to-br from-primary/15 to-primary/8 rounded-3xl overflow-hidden flex items-center justify-center shadow-md">
          <img
            src={formData.image || sampleImage}
            alt="Issue"
            className="object-cover w-full h-full"
            onError={(e) => {
              // fallback to icon when image missing
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="hidden">
            <AlertTriangle size={48} className="text-primary" />
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-4">
        {/* Title Card overlapping image */}
        <div className="card-elevated">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-2">{formData.title}</h2>
              <p className="text-muted-foreground mb-3">{formData.description}</p>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">Road Damage</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${formData.severity === "High" ? "severity-high" : formData.severity === "Medium" ? "severity-medium" : "severity-low"
                  }`}>{formData.severity} Severity</span>
              </div>
            </div>
            <button onClick={() => navigate("/report", { state: formData })} className="text-primary text-sm font-medium">Edit</button>
          </div>
        </div>

        {/* Map / Location Card */}
        <div className="card-elevated">
          <div className="h-36 bg-secondary/30 rounded-xl mb-4" />
          <h3 className="text-sm font-semibold text-foreground mb-2">Location</h3>
          <p className="text-foreground font-semibold">{formData.location}</p>
          <p className="text-xs text-muted-foreground mt-1">40.7128° N, 74.0060° W</p>
        </div>

        {/* Details */}
        <div className="card-elevated space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-primary" />
              <div>
                <div className="text-sm text-foreground font-medium">Date & Time</div>
                <div className="text-sm text-muted-foreground">Oct 26, 10:45 AM</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tag size={18} className="text-primary" />
              <div>
                <div className="text-sm text-foreground font-medium">Category</div>
                <div className="text-sm text-muted-foreground">Road Damage</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye size={18} className="text-primary" />
              <div>
                <div className="text-sm text-foreground font-medium">Report Anonymously</div>
                <div className="text-sm text-muted-foreground">{formData.anonymous ? "Yes" : "No"}</div>
              </div>
            </div>
            <div />
          </div>
        </div>

        {/* Submit button */}
        <div className="">
          <button onClick={handleSubmit} className="btn-gradient">Submit Issue</button>
        </div>

        <div className="text-center mt-2">
          <button onClick={() => navigate("/report", { state: formData })} className="text-primary text-sm">Edit Details</button>
        </div>
      </div>
    </div>
  );
};

export default IssuePreview;

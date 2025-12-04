import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Tag, Eye, Edit, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import sampleImage from "@/assets/pages/page_1.jpg";

const IssuePreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formData = location.state || {
    title: "Large Pothole on Main St",
    description: "Deep pothole causing traffic issues and potential danger to cyclists.",
    location: "123 Main Street, Anytown, USA",
    severity: "High",
    category: "Road Issues",
    anonymous: true,
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to submit a report");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload Image if exists (We'll skip actual file upload for now and store base64 or just URL if it was a real file upload flow)
      // For this demo, we'll assume the image is small enough to store or we'll just store the text data.
      // In a real app, you'd upload to Supabase Storage here.

      const reportData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        severity: formData.severity.toLowerCase(),
        location_name: formData.location,
        status: 'pending',
        image_url: formData.image, // Storing base64 for now (not recommended for production but works for demo)
        // latitude: ... (if we had coordinates)
        // longitude: ...
      };

      const { error } = await supabase
        .from('reports')
        .insert(reportData);

      if (error) throw error;

      toast.success("Issue reported successfully!");
      navigate("/home");
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
                <div className="text-sm text-muted-foreground">{formData.category}</div>
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
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-gradient flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : "Submit Issue"}
          </button>
        </div>

        <div className="text-center mt-2">
          <button onClick={() => navigate("/report", { state: formData })} className="text-primary text-sm">Edit Details</button>
        </div>
      </div>
    </div>
  );
};

export default IssuePreview;

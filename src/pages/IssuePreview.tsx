import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Tag, Eye, Edit, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import sampleImage from "@/assets/pages/page_1.jpg";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/clerk-react";

const IssuePreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [submitting, setSubmitting] = useState(false);

  const formData = location.state || {
    title: "Large Pothole on Main St",
    description: "Deep pothole causing traffic issues and potential danger to cyclists.",
    location: "123 Main Street, Anytown, USA",
    severity: "High",
    category: "Road Issues",
    anonymous: true,
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error("Please provide a title for the issue");
      return;
    }

    setSubmitting(true);

    try {
      // Map severity to priority
      const priorityMap: any = {
        'Low': 'low',
        'Medium': 'medium',
        'High': 'high',
      };

      const issueData = {
        title: formData.title,
        description: formData.description || '',
        category: 'Roads', // Default category, can be enhanced later
        status: 'open',
        priority: priorityMap[formData.severity] || 'medium',
        location: formData.location,
        district: 'Unknown', // Can be extracted from location
        state: 'Unknown', // Can be extracted from location
        image_url: formData.image || null,
        reported_by: user?.id || 'anonymous',
        reporter_name: formData.anonymous ? null : (user?.fullName || 'Unknown'),
        is_anonymous: formData.anonymous,
        upvotes: 0,
      };

      const { data, error } = await supabase
        .from('issues')
        .insert([issueData])
        .select()
        .single();

      if (error) {
        console.error('Error submitting issue:', error);
        toast.error("Failed to submit issue. Please try again.");
        return;
      }

      toast.success("Issue reported successfully!");
      navigate("/home");
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
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
            disabled={submitting}
            className="btn-gradient flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Issue'
            )}
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

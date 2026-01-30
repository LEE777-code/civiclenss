import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Tag, Eye, Edit, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import sampleImage from "@/assets/pages/page_1.jpg";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/clerk-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ImageModal from "@/components/ImageModal";

// Fix for default Leaflet marker icons in React/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const IssuePreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [submitting, setSubmitting] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const formData = location.state || {
    title: "Large Pothole on Main St",
    description: "Deep pothole causing traffic issues and potential danger to cyclists.",
    location: "123 Main Street, Anytown, USA",
    severity: "High",
    category: "Road Issues",
    anonymous: true,
  };

  // Handle image preview - convert File to URL if needed
  useEffect(() => {
    if (formData.image) {
      if (typeof formData.image === 'string') {
        // It's already a URL or base64 string
        setImagePreviewUrl(formData.image);
      } else if (formData.image instanceof File || formData.image instanceof Blob) {
        // It's a File/Blob object, convert to preview URL
        const url = URL.createObjectURL(formData.image);
        setImagePreviewUrl(url);

        // Cleanup on unmount
        return () => {
          URL.revokeObjectURL(url);
        };
      } else {
        setImagePreviewUrl(sampleImage);
      }
    } else {
      setImagePreviewUrl(sampleImage);
    }
  }, [formData.image]);

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error("Please provide a title for the issue");
      return;
    }

    // SPAM CONTROL: Check for recent submissions (rate limit: 5 minutes)
    const lastSubmission = localStorage.getItem('last_report_timestamp');
    if (lastSubmission) {
      const timeSinceLast = Date.now() - parseInt(lastSubmission);
      const cooldown = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (timeSinceLast < cooldown) {
        const minutesLeft = Math.ceil((cooldown - timeSinceLast) / 60000);
        toast.error(`Please wait ${minutesLeft} minute(s) before submitting another report.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      // Map severity directly (reports table uses severity, not priority)
      const severityMap: any = {
        'Low': 'low',
        'Medium': 'medium',
        'High': 'high',
      };

      // Generate a unique user ID if not logged in
      let userId = user?.id;
      if (!userId) {
        // Check if we have a stored anonymous ID
        userId = localStorage.getItem('anonymous_user_id');
        if (!userId) {
          // Generate a new one
          userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('anonymous_user_id', userId);
        }
      }

      const reportData = {
        title: formData.title,
        description: formData.description || '',
        category: formData.category || 'Other', // Use the selected category
        status: 'pending', // Reports use 'pending' instead of 'open'
        severity: severityMap[formData.severity] || 'medium',
        location_name: formData.location, // Reports use 'location_name' instead of 'location'
        latitude: formData.latitude || null, // Use coordinates if available
        longitude: formData.longitude || null, // Use coordinates if available
        image_url: formData.image || null,
        user_id: userId,
        upvotes: 0,
      };



      const { data, error } = await supabase
        .from("reports")
        .insert([reportData])
        .select('id') // Only return id for notification
        .single();

      if (error) {
        console.error('Error submitting issue:', error);
        toast.error(`Failed to submit issue: ${error.message}`);
        return;
      }

      // SPAM CONTROL: Update timestamp on successful submission
      localStorage.setItem('last_report_timestamp', Date.now().toString());

      // Automatically trigger nearby notifications (event-driven)
      try {
        if (formData.latitude && formData.longitude && data[0]?.id) {
          // Insert notification event - trigger will handle sending
          await supabase.from('notifications').insert({
            recipient_type: 'broadcast',
            actor_clerk_id: userId,
            report_id: data[0].id,
            type: 'issue_submitted',
            title: `New ${formData.category} Issue`,
            body: formData.title || 'A new issue was reported',
            status: 'pending'
          });
        }
      } catch (notifError) {
        console.log('Notification creation failed:', notifError);
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

      {/* Content Container with spacing */}
      <div className="px-6 pt-2 pb-6 space-y-5">
        {/* Large Image */}
        <div className="w-full h-72 bg-gradient-to-br from-primary/15 to-primary/8 rounded-2xl overflow-hidden shadow-lg">
          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt="Issue"
              className="object-cover w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setImageModalOpen(true)}
              onError={(e) => {
                // fallback to sample image if error
                (e.currentTarget as HTMLImageElement).src = sampleImage;
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <AlertTriangle size={48} className="mb-2" />
              <p className="text-sm">No image available</p>
            </div>
          )}
        </div>

        {/* Title and Description Card */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-foreground flex-1">{formData.title}</h2>
            <button
              onClick={() => navigate("/report", { state: formData })}
              className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
            >
              <Edit size={16} />
              Edit
            </button>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed mb-4">{formData.description}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-4 py-1.5 bg-secondary/50 text-foreground rounded-full text-xs font-medium">
              {formData.category}
            </span>
            <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${formData.severity === "High" ? "severity-high" :
              formData.severity === "Medium" ? "severity-medium" :
                "severity-low"
              }`}>
              {formData.severity} Severity
            </span>
          </div>
        </div>

        {/* Map / Location Card */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={18} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Location</h3>
          </div>

          <div className="h-40 bg-secondary/30 rounded-xl mb-4 overflow-hidden">
            {formData.latitude && formData.longitude ? (
              <MapContainer
                center={[parseFloat(formData.latitude), parseFloat(formData.longitude)]}
                zoom={15}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[parseFloat(formData.latitude), parseFloat(formData.longitude)]} />
              </MapContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Map Preview - No coordinates available
              </div>
            )}
          </div>

          <p className="text-foreground font-medium mb-1">{formData.location}</p>
          <p className="text-xs text-muted-foreground">
            {formData.latitude && formData.longitude
              ? `${parseFloat(formData.latitude).toFixed(4)}° N, ${parseFloat(formData.longitude).toFixed(4)}° W`
              : 'Coordinates not available'}
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-foreground font-medium">Date & Time</div>
              <div className="text-sm text-muted-foreground">Oct 26, 10:45 AM</div>
            </div>
          </div>

          <div className="h-px bg-border/50" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Tag size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-foreground font-medium">Category</div>
              <div className="text-sm text-muted-foreground">{formData.category}</div>
            </div>
          </div>

          <div className="h-px bg-border/50" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Eye size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-foreground font-medium">Report Anonymously</div>
              <div className="text-sm text-muted-foreground">{formData.anonymous ? "Yes" : "No"}</div>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-gradient flex items-center justify-center gap-2 disabled:opacity-70 w-full"
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

        <div className="text-center pb-4">
          <button
            onClick={() => navigate("/report", { state: formData })}
            className="text-primary text-sm font-medium hover:underline"
          >
            Edit Details
          </button>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModalOpen}
        imageUrl={imagePreviewUrl}
        onClose={() => setImageModalOpen(false)}
        altText="Issue Preview Image"
      />
    </div >
  );
};

export default IssuePreview;

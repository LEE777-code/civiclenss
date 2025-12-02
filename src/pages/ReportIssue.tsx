import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, MapPin, Eye } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const ReportIssue = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "123 Market St, San Francisco, CA",
    severity: "Medium",
    anonymous: false,
  });

  const handleSubmit = () => {
    navigate("/issue-preview", { state: formData });
  };

  return (
    <div className="mobile-container min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Report an Issue</h1>
        </div>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Add Photos */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Add Photos</h2>
          <button className="w-full h-32 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 bg-muted/30">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Camera size={24} className="text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Tap to capture or upload from gallery</span>
          </button>
        </div>

        {/* Issue Details */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Issue Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Issue Title</label>
              <input
                type="text"
                placeholder="e.g., Pothole on Main Street"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
              <textarea
                placeholder="Provide a detailed description of the issue."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field min-h-[100px] resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  value={formData.location}
                  readOnly
                  className="input-field pl-12 pr-20"
                />
                <button
                  onClick={() => navigate("/choose-location")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-medium text-sm"
                >
                  Change
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">Severity</label>
              <div className="flex gap-2">
                {["Low", "Medium", "High"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setFormData({ ...formData, severity: level })}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      formData.severity === level
                        ? level === "Low"
                          ? "bg-green-500 text-primary-foreground"
                          : level === "Medium"
                          ? "bg-amber-500 text-primary-foreground"
                          : "bg-red-500 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="font-medium text-foreground">Report Anonymously</span>
                <p className="text-sm text-muted-foreground mt-0.5">Your identity will not be shared</p>
              </div>
              <button
                onClick={() => setFormData({ ...formData, anonymous: !formData.anonymous })}
                className={`w-12 h-7 rounded-full transition-colors ${
                  formData.anonymous ? "bg-primary" : "bg-muted"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-primary-foreground rounded-full shadow-sm transition-transform mx-1 ${
                    formData.anonymous ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} className="btn-primary flex items-center justify-center gap-2">
          <Eye size={20} />
          Submit Issue
        </button>
        <p className="text-center text-sm text-muted-foreground -mt-2">Preview before submitting</p>
      </div>

      <BottomNav />
    </div>
  );
};

export default ReportIssue;

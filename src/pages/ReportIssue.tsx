import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Camera, MapPin, Eye, Sparkles } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import SwipeWrapper from "@/components/SwipeWrapper";
import { generateImageDescription, generateImageTitle, suggestCategory } from "@/services/geminiVision";

const ReportIssue = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState(location.state || {
    title: "",
    description: "",
    location: "123 Market St, San Francisco, CA",
    category: "",
    severity: "Medium",
    anonymous: false,
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(location.state?.image || null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result as string;
        setSelectedImage(imageData);
        setShowImageOptions(false);

        // Auto-generate description using Gemini Vision API
        setIsAnalyzing(true);
        toast.info("🤖 Analyzing image with AI...", { duration: 2000 });

        try {
          // Run all AI analyses in parallel for faster results
          const [description, title, category] = await Promise.all([
            generateImageDescription(imageData),
            generateImageTitle(imageData),
            suggestCategory(imageData)
          ]);

          // Update form with AI-generated content
          setFormData(prev => ({
            ...prev,
            description: description,
            title: title,
            category: category
          }));

          toast.success("✨ AI analysis complete! Review and edit as needed.", { duration: 3000 });
        } catch (error) {
          console.error("AI analysis error:", error);
          toast.error("Failed to analyze image. You can still fill in details manually.", { duration: 4000 });
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Please provide a title for the issue");
      return;
    }

    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    navigate("/issue-preview", { state: { ...formData, image: selectedImage } });
  };

  return (
    <SwipeWrapper className="mobile-container min-h-screen bg-background pb-24 relative">
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

          {selectedImage ? (
            <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-border">
              <img src={selectedImage} alt="Issue" className="w-full h-full object-cover" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
              >
                <ArrowLeft size={20} className="rotate-45" /> {/* Using rotate for X icon effect if X not imported, or just import X */}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowImageOptions(true)}
              className="w-full h-32 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Camera size={24} className="text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Tap to capture or upload from gallery</span>
            </button>
          )}
        </div>

        {/* Issue Details */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Issue Details</h2>

          <div className="space-y-4">
            {/* AI Analyzing Indicator */}
            {isAnalyzing && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
                <div className="animate-pulse">
                  <Sparkles className="text-primary" size={24} />
                </div>
                <div>
                  <p className="font-medium text-foreground">AI is analyzing your image...</p>
                  <p className="text-sm text-muted-foreground">This will auto-fill the details below</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Issue Title</label>
              <input
                type="text"
                placeholder="e.g., Pothole on Main Street"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                disabled={isAnalyzing}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
              <textarea
                placeholder="Provide a detailed description of the issue."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field min-h-[100px] resize-none"
                disabled={isAnalyzing}
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
                  onClick={() => navigate("/choose-location", { state: formData })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-medium text-sm"
                >
                  Change
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
                disabled={isAnalyzing}
              >
                <option value="">Select Category</option>
                <option value="Road Issues">Road Issues</option>
                <option value="Garbage & Cleanliness">Garbage & Cleanliness</option>
                <option value="Water / Drainage">Water / Drainage</option>
                <option value="Streetlight / Electricity">Streetlight / Electricity</option>
                <option value="Public Safety">Public Safety</option>
                <option value="Public Facilities">Public Facilities</option>
                <option value="Parks & Environment">Parks & Environment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">Severity</label>
              <div className="flex gap-2">
                {["Low", "Medium", "High"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setFormData({ ...formData, severity: level })}
                    disabled={isAnalyzing}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${formData.severity === level
                      ? level === "Low"
                        ? "bg-green-500 text-primary-foreground"
                        : level === "Medium"
                          ? "bg-amber-500 text-primary-foreground"
                          : "bg-red-500 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                      } ${isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}`}
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
                className={`w-12 h-7 rounded-full transition-colors ${formData.anonymous ? "bg-primary" : "bg-muted"
                  }`}
              >
                <div
                  className={`w-5 h-5 bg-primary-foreground rounded-full shadow-sm transition-transform mx-1 ${formData.anonymous ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Eye size={20} />
          Preview
        </button>
        <p className="text-center text-sm text-muted-foreground -mt-2">Tap to preview before final submission</p>
      </div>

      <BottomNav />

      {/* Image Selection Modal */}
      {showImageOptions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center p-4">
          <div className="bg-background w-full max-w-sm rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom-10 fade-in">
            <h3 className="text-lg font-semibold text-center mb-2">Select Image Source</h3>

            <label className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted transition-colors">
              <Camera className="text-primary" size={24} />
              <span className="font-medium">Take Photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>

            <label className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted transition-colors">
              <div className="w-6 h-6 border-2 border-primary rounded-md flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <span className="font-medium">Choose from Gallery</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>

            <button
              onClick={() => setShowImageOptions(false)}
              className="w-full py-3 text-center font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </SwipeWrapper>
  );
};

export default ReportIssue;

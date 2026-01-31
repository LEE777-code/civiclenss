import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Camera, MapPin, Eye, Sparkles, WifiOff, Mic, MicOff } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import SwipeWrapper from "@/components/SwipeWrapper";
import { generateImageDescription, generateImageTitle, suggestCategory, analyzeGrievance } from "@/services/geminiVision";
import ImageModal from "@/components/ImageModal";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";

interface Department {
  id: string;
  name: string;
  type: string;
}

const SLA_CONFIG: Record<string, number> = {
  "Road Issues": 72, // 3 days
  "Garbage & Cleanliness": 48, // 2 days
  "Water / Drainage": 24, // 1 day
  "Streetlight / Electricity": 6, // 6 hours
  "Public Safety": 4, // 4 hours
  "Public Facilities": 120, // 5 days
  "Parks & Environment": 96, // 4 days
  "Other": 168 // 7 days
};

const ReportIssue = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();
  const [formData, setFormData] = useState(location.state || {
    title: "",
    description: "",
    location: "123 Market St, San Francisco, CA",
    category: "",
    severity: "Medium",
    anonymous: false,
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(location.state?.image || null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result as string;
        setSelectedImage(imageData);
        setShowImageOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US'; // Default to English for better accuracy in descriptions
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening... Speak now.");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFormData((prev: any) => ({
        ...prev,
        description: prev.description ? `${prev.description} ${transcript}` : transcript
      }));
      toast.success("Voice input added!");
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'no-speech') {
        toast.info("No speech detected. Please tap to try again.");
      } else if (event.error === 'not-allowed') {
        toast.error("Microphone access denied. Please allow permissions.");
      } else {
        toast.error("Error hearing voice. Please try again.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  useEffect(() => {
    // Fetch departments on mount
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      const { data, error } = await supabase
        .from('departments')
        .select('*');

      if (data) {
        setDepartments(data);
      } else if (error) {
        console.error("Error fetching departments:", error);
      }
      setLoadingDepartments(false);
    };

    fetchDepartments();
  }, []);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Please provide a title for the issue");
      return;
    }

    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    // 1. Find assigned department
    const assignedDept = departments.find(d => d.type === formData.category) || departments.find(d => d.name.includes("Municipal")) || null;
    const departmentId = assignedDept?.id || null;
    const departmentName = assignedDept?.name || "General Administration";

    // 2. Calculate SLA & Deadline
    const slaHours = SLA_CONFIG[formData.category] || 72; // Default 3 days
    // Note: We calculate deadline here for PREVIEW purposes, but should also generate it on server-side or confirm on final submit
    const deadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    navigate("/issue-preview", {
      state: {
        ...formData,
        image: selectedImage,
        departmentId,
        departmentName,
        slaHours,
        deadline
      }
    });
  };

  return (
    <SwipeWrapper className="mobile-container min-h-screen bg-background pb-24 relative">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("report.title")}</h1>
        </div>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Add Photos */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">{t("report.addPhotos")}</h2>

          {selectedImage ? (
            <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-border">
              <img
                src={selectedImage}
                alt="Issue"
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setImageModalOpen(true)}
              />
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
          <h2 className="text-lg font-semibold text-foreground mb-3">{t("report.issueDetails")}</h2>

          <div className="space-y-4">
            {/* Offline Warning */}
            {!isOnline && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <WifiOff className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-amber-900">You're offline</p>
                  <p className="text-sm text-amber-700 mt-0.5">Reports can only be submitted when online. You can draft your report now and submit it later.</p>
                </div>
              </div>
            )}

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
              <label className="text-sm font-medium text-foreground mb-2 block">{t("report.issueTitle")}</label>
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
              <label className="text-sm font-medium text-foreground mb-2 block">{t("report.description")}</label>
              <div className="flex items-center justify-between mb-2">
                <label className="sr-only">Description</label>

                <div className="flex gap-3 ml-auto">
                  {/* Voice Input Button */}
                  <button
                    onClick={startVoiceInput}
                    className={`text-sm font-medium flex items-center gap-1 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-primary'}`}
                    disabled={generating || isAnalyzing}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    {isListening ? "Stop" : "Voice Input"}
                  </button>

                  <button
                    onClick={async () => {
                      if (!isOnline) {
                        toast.error("AI analysis requires an internet connection");
                        return;
                      }

                      if (!selectedImage) {
                        toast.error("Please upload an image first");
                        return;
                      }

                      setGenerating(true);
                      setIsAnalyzing(true);
                      toast.info("🤖 Analyzing image & context...", { duration: 2000 });

                      try {
                        const input = selectedImageFile || selectedImage;

                        // Pass current description as context if available!
                        const currentDescription = formData.description;

                        // Use static import function
                        const result = await analyzeGrievance(input, currentDescription);

                        setFormData(prev => ({
                          ...prev,
                          description: result.description,
                          title: result.title,
                          category: result.category,
                          severity: result.severity,
                        }));

                        // Show confidence if low
                        if (result.confidence < 0.6) {
                          toast.warning("Low confidence analysis. Please verify details.");
                        } else {
                          toast.success("✨ Analysis complete!");
                        }

                      } catch (e) {
                        console.error(e);
                        toast.error("Analysis failed. Please try again manually.");
                      } finally {
                        setGenerating(false);
                        setIsAnalyzing(false);
                      }
                    }}
                    className="text-sm text-primary font-medium"
                    disabled={generating || isAnalyzing || !isOnline}
                  >
                    {generating ? t("report.analyzing") : t("report.analyze")}
                  </button>
                </div>
              </div>
              <textarea
                placeholder="Provide a detailed description of the issue."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field min-h-[100px] resize-none"
                disabled={isAnalyzing}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{t("report.location")}</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  value={formData.location}
                  readOnly
                  className="input-field pl-12 pr-20"
                />
                <button
                  onClick={() => navigate("/choose-location", { state: { ...formData, image: selectedImage } })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-medium text-sm"
                >
                  Change
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{t("report.category")}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
                disabled={isAnalyzing}
              >
                <option value="">Select Category</option>
                <option value="Roads & Maintenance">Roads & Maintenance</option>
                <option value="Streetlights & Electricity">Streetlights & Electricity</option>
                <option value="Water Supply">Water Supply</option>
                <option value="Drainage & Storm Water">Drainage & Storm Water</option>
                <option value="Garbage & Sanitation">Garbage & Sanitation</option>
                <option value="Public Health & Hygiene">Public Health & Hygiene</option>
                <option value="Parks & Playgrounds">Parks & Playgrounds</option>
                <option value="Public Transport">Public Transport</option>
                <option value="Traffic & Road Safety">Traffic & Road Safety</option>
                <option value="Encroachment">Encroachment</option>
                <option value="Stray Animals">Stray Animals</option>
                <option value="Revenue & Tax">Revenue & Tax</option>
                <option value="Building Plan Violations">Building Plan Violations</option>
                <option value="Trees & Environment">Trees & Environment</option>
                <option value="Disaster Management">Disaster Management</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">{t("report.severity")}</label>
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
          {t("report.submit")}
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

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModalOpen}
        imageUrl={selectedImage}
        onClose={() => setImageModalOpen(false)}
        altText="Report Issue Image"
      />
    </SwipeWrapper>
  );
};

export default ReportIssue;

// Utility: convert dataURL (base64) to a File object
function dataURLToFile(dataUrl: string, filename: string) {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

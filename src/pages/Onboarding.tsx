import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, FileText, Bell, Sparkles } from "lucide-react";

const slides = [
  {
    icon: FileText,
    title: "Report Issues Easily",
    description: "Help your city stay safe and clean in just a few taps.",
    color: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    icon: Bell,
    title: "Get Instant Updates",
    description: "Track the status of issues you reported.",
    color: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Sparkles,
    title: "Smarter Issue Management",
    description: "AI auto-detects severity and removes duplicate reports for cleaner admin workflow.",
    color: "bg-purple-100",
    iconColor: "text-purple-600",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/login");
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="mobile-container flex flex-col h-[100dvh] overflow-hidden bg-background px-6 py-6 safe-area-top safe-area-bottom touch-none">
      {/* Top Section: Image & Text */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0">
        <div className={`w-full max-w-[280px] aspect-square ${slide.color} rounded-3xl flex items-center justify-center mb-6 shadow-sm shrink-0`}>
          <Icon size={80} className={slide.iconColor} />
        </div>

        <div className="flex flex-col items-center gap-3 overflow-y-auto px-2">
          <h1 className="text-2xl font-extrabold text-foreground text-center leading-tight">
            {slide.title}
          </h1>
          <p className="text-muted-foreground text-center text-base max-w-xs">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom Section: Indicators & Buttons */}
      <div className="flex flex-col gap-6 pt-4 shrink-0">
        {/* Indicators */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`rounded-full transition-all duration-300 ${index === currentSlide ? "bg-primary w-6 h-2" : "bg-muted-foreground/30 w-2 h-2"
                }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between w-full">
          <button
            onClick={handleBack}
            className={`text-muted-foreground font-medium px-4 py-2 hover:text-foreground transition-colors ${currentSlide === 0 ? 'invisible' : ''}`}
          >
            Back
          </button>

          <button
            onClick={handleNext}
            className="btn-primary w-auto px-8 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

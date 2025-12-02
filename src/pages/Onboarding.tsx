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
    <div className="mobile-container flex flex-col min-h-screen bg-background px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className={`w-64 h-64 ${slide.color} rounded-full flex items-center justify-center mb-12 animate-scale-in`}>
          <Icon size={100} className={slide.iconColor} />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground text-center mb-4 animate-fade-in">
          {slide.title}
        </h1>
        <p className="text-muted-foreground text-center text-base max-w-xs animate-fade-in">
          {slide.description}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-8">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? "w-8 bg-primary" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      <div className="flex gap-3">
        {currentSlide > 0 && (
          <button
            onClick={handleBack}
            className="btn-secondary flex-1"
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Onboarding;

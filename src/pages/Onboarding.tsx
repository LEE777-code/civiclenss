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
    <div className="mobile-container flex flex-col min-h-screen bg-background px-6 py-8">
      <div className="flex-1 flex flex-col items-center justify-start pt-6">
        <div className={`w-full max-w-md h-64 ${slide.color} rounded-2xl flex items-center justify-center mb-8 shadow-md`}>
          <Icon size={100} className={slide.iconColor} />
        </div>

        <h1 className="text-3xl font-extrabold text-foreground text-center mb-4">
          {slide.title}
        </h1>
        <p className="text-muted-foreground text-center text-lg max-w-lg px-6">
          {slide.description}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 mb-6">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? "bg-primary w-3 h-3" : "bg-muted-foreground/40 w-2 h-2"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        {currentSlide > 0 ? (
          <button onClick={handleBack} className="text-foreground font-medium">Back</button>
        ) : (
          <div />
        )}

        <div className="w-36">
          <button
            onClick={handleNext}
            className="btn-gradient flex items-center justify-center gap-2"
          >
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

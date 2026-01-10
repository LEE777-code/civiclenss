import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import onboardingReport from "@/assets/onboarding_report_issues.png";
import onboardingNotifications from "@/assets/onboarding_notifications.png";
import onboardingAI from "@/assets/onboarding_ai_smart.png";

const slides = [
  {
    image: onboardingReport,
    title: "Report Issues Easily",
    description: "Help your city stay safe and clean in just a few taps.",
    color: "bg-emerald-50",
  },
  {
    image: onboardingNotifications,
    title: "Get Instant Updates",
    description: "Track the status of issues you reported.",
    color: "bg-blue-50",
  },
  {
    image: onboardingAI,
    title: "Smarter Issue Management",
    description: "AI auto-detects severity and removes duplicate reports for cleaner admin workflow.",
    color: "bg-purple-50",
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

  return (
    <div className="mobile-container flex flex-col h-[100dvh] overflow-hidden bg-background safe-area-top safe-area-bottom touch-none">
      {/* Top Section: Image & Text */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 min-h-0">
        <div className={`w-full max-w-[340px] aspect-square ${slide.color} rounded-3xl flex items-center justify-center p-8 mb-8 shadow-lg shrink-0 overflow-hidden`}>
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex flex-col items-center gap-4 px-4">
          <h1 className="text-3xl font-extrabold text-foreground text-center leading-tight">
            {slide.title}
          </h1>
          <p className="text-muted-foreground text-center text-base max-w-sm leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom Section: Indicators & Buttons */}
      <div className="flex flex-col gap-8 px-6 pb-8 shrink-0">
        {/* Indicators */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`rounded-full transition-all duration-300 ${index === currentSlide ? "bg-primary w-8 h-2.5" : "bg-muted-foreground/30 w-2.5 h-2.5"
                }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between w-full">
          <button
            onClick={handleBack}
            className={`text-muted-foreground font-semibold px-6 py-2.5 hover:text-foreground transition-colors ${currentSlide === 0 ? 'invisible' : ''}`}
          >
            Back
          </button>

          <button
            onClick={handleNext}
            className="btn-primary w-auto px-10 py-3.5 rounded-full flex items-center gap-2 shadow-lg shadow-primary/30 font-semibold"
          >
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

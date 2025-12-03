import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/onboarding");
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="mobile-container flex flex-col items-center justify-center min-h-screen bg-primary">
      <div className="animate-scale-in flex flex-col items-center gap-4">
        <div className="w-24 h-24 bg-primary-foreground/20 rounded-3xl flex items-center justify-center">
          <Shield size={56} className="text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-primary-foreground tracking-tight text-center px-4">
          CivicLens – Together, We Fix the City
        </h1>
      </div>
    </div>
  );
};

export default Splash;

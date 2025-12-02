import { useNavigate } from "react-router-dom";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="mobile-container flex flex-col items-center justify-center min-h-screen bg-background px-6">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <AlertCircle size={48} className="text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
      <p className="text-muted-foreground text-center mb-8">
        Oops! The page you're looking for doesn't exist.
      </p>
      <button
        onClick={() => navigate("/home")}
        className="btn-primary flex items-center justify-center gap-2"
      >
        <Home size={20} />
        Return to Home
      </button>
    </div>
  );
};

export default NotFound;

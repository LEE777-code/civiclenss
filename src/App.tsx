import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated } from "@/services/authService";
import OfflineIndicator from "@/components/OfflineIndicator";
import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import ReportIssue from "./pages/ReportIssue";
import ChooseLocation from "./pages/ChooseLocation";
import IssuePreview from "./pages/IssuePreview";
import NearbyAlerts from "./pages/NearbyAlerts";
import MyReports from "./pages/MyReports";
import ReportDetails from "./pages/ReportDetails";
import MapView from "./pages/MapView";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
};

// Auth Route Component (redirects to home if already authenticated)
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  return isAuthenticated() ? <Navigate to="/home" replace /> : <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OfflineIndicator />
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/onboarding" element={<AuthRoute><Onboarding /></AuthRoute>} />
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
          <Route path="/choose-location" element={<ProtectedRoute><ChooseLocation /></ProtectedRoute>} />
          <Route path="/issue-preview" element={<ProtectedRoute><IssuePreview /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><NearbyAlerts /></ProtectedRoute>} />
          <Route path="/my-reports" element={<ProtectedRoute><MyReports /></ProtectedRoute>} />
          <Route path="/report-details/:id" element={<ProtectedRoute><ReportDetails /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

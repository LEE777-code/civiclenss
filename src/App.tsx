import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/choose-location" element={<ChooseLocation />} />
          <Route path="/issue-preview" element={<IssuePreview />} />
          <Route path="/alerts" element={<NearbyAlerts />} />
          <Route path="/my-reports" element={<MyReports />} />
          <Route path="/report-details/:id" element={<ReportDetails />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

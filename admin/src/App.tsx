import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";
import { AuthProvider } from "./contexts/AuthContext";

// Auth Pages
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";

// Admin Pages
import { AdminLayout } from "./components/layout/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Issues from "./pages/admin/Issues";
import Analytics from "./pages/admin/Analytics";
import Categories from "./pages/admin/Categories";
import Admins from "./pages/admin/Admins";
import Profile from "./pages/admin/Profile";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

const App = () => (
  <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

              {/* Auth Routes */}
              <Route path="/auth/signin" element={
                <SignedOut>
                  <SignIn />
                </SignedOut>
              } />
              <Route path="/auth/signup" element={
                <SignedOut>
                  <SignUp />
                </SignedOut>
              } />

              {/* Admin Routes - Protected */}
              <Route path="/admin" element={
                <SignedIn>
                  <AdminLayout />
                </SignedIn>
              }>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="issues" element={<Issues />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="categories" element={<Categories />} />
                <Route path="admins" element={<Admins />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;

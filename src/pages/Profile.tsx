import { useNavigate } from "react-router-dom";
import { User, FileText, Edit, Moon, Bell, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { useUser, SignOutButton, useClerk } from "@clerk/clerk-react";
import BottomNav from "@/components/BottomNav";
import { useTheme } from "@/hooks/use-theme";
import SwipeWrapper from "@/components/SwipeWrapper";
import { clearAuthState } from "@/services/authService";
import { clearOfflineCache, cacheUserProfile, getCachedUserProfile, getCachedReportStats } from "@/services/offlineService";
import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();
  const isOnline = useOnlineStatus();
  const [reportCounts, setReportCounts] = useState({ pending: 0, resolved: 0 });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Cache user profile when user data is available
  useEffect(() => {
    const cacheProfile = async () => {
      if (user && isOnline) {
        await cacheUserProfile({
          user_id: user.id,
          full_name: user.fullName || undefined,
          email: user.primaryEmailAddress?.emailAddress || undefined,
          image_url: user.imageUrl || undefined
        });
      }
    };
    cacheProfile();
  }, [user, isOnline]);

  // Fetch report counts
  useEffect(() => {
    const fetchReportCounts = async () => {
      // Try cached data first
      const cachedStats = await getCachedReportStats();
      if (cachedStats) {
        setReportCounts({
          pending: cachedStats.pending_count,
          resolved: cachedStats.resolved_count
        });
      }

      // Fetch fresh data if online
      if (isOnline && user) {
        try {
          const { count: pendingCount } = await supabase
            .from('reports')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'pending');

          const { count: resolvedCount } = await supabase
            .from('reports')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'resolved');

          setReportCounts({
            pending: pendingCount || 0,
            resolved: resolvedCount || 0
          });
        } catch (error) {
          console.error('Error fetching report counts:', error);
        }
      }
    };

    fetchReportCounts();
  }, [user, isOnline]);

  // Load notification preference
  useEffect(() => {
    const loadNotificationPreference = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_devices')
            .select('notifications_enabled')
            .eq('clerk_id', user.id)
            .single();

          if (data && !error) {
            setNotificationsEnabled(data.notifications_enabled ?? true);
          }
        } catch (error) {
          console.error('Error loading notification preference:', error);
        }
      }
    };
    loadNotificationPreference();
  }, [user]);

  // Toggle notification preference
  const handleNotificationToggle = async () => {
    if (!user) return;

    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);

    try {
      const { error } = await supabase
        .from('user_devices')
        .update({ notifications_enabled: newValue })
        .eq('clerk_id', user.id);

      if (error) throw error;

      toast.success(newValue ? 'Notifications enabled' : 'Notifications disabled');
    } catch (error) {
      console.error('Error updating notification preference:', error);
      setNotificationsEnabled(!newValue); // Revert on error
      toast.error('Failed to update notification preference');
    }
  };

  const handleLogout = async () => {
    try {
      // Clear auth state
      clearAuthState();

      // Clear offline cache
      await clearOfflineCache();

      // Sign out from Clerk
      await signOut();

      // Navigate to login
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if there's an error, clear local state and navigate
      clearAuthState();
      navigate("/login");
    }
  };

  const menuItems = [
    { icon: Moon, label: "Dark Mode", type: "toggle" },
    { icon: Bell, label: "Notifications", type: "toggle" },
    { icon: HelpCircle, label: "Help & Support", type: "link" },
  ];

  return (
    <SwipeWrapper className="mobile-container min-h-screen bg-muted pb-24">
      {/* Header */}
      <div className="bg-primary px-6 pt-12 pb-8 rounded-b-3xl">
        <h1 className="text-xl font-bold text-primary-foreground mb-6">Profile</h1>

        {/* Profile Info */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-primary-foreground/20 rounded-full flex items-center justify-center overflow-hidden">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-primary-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary-foreground">
              {user?.fullName || "User"}
            </h2>
            <p className="text-primary-foreground/80">
              {user?.primaryEmailAddress?.emailAddress || "No email"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-4 space-y-4">
        {/* My Reports Card */}
        <button
          onClick={() => navigate("/my-reports")}
          className="card-elevated w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">My Reports</h3>
              <p className="text-sm text-muted-foreground">{reportCounts.pending} Pending, {reportCounts.resolved} Resolved</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-muted-foreground" />
        </button>

        {/* Edit Profile Card */}
        <button
          onClick={() => navigate("/edit-profile")}
          className="card-elevated w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Edit size={24} className="text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Edit Profile</h3>
              <p className="text-sm text-muted-foreground">Update your name, email, phone</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-muted-foreground" />
        </button>

        {/* Settings */}
        <div className="card-elevated">
          <h3 className="font-semibold text-foreground mb-4">Settings</h3>
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <div
                key={item.label}
                className={`flex items-center justify-between py-3 ${index < menuItems.length - 1 ? "border-b border-border" : ""
                  }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className="text-muted-foreground" />
                  <span className="text-foreground">{item.label}</span>
                </div>
                {item.type === "toggle" ? (
                  item.label === "Dark Mode" ? (
                    <ThemeToggle />
                  ) : item.label === "Notifications" ? (
                    <button
                      onClick={handleNotificationToggle}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors ${notificationsEnabled ? "bg-primary" : "bg-muted"
                        }`}
                      aria-label="Toggle notifications"
                    >
                      <div
                        className={`w-5 h-5 bg-primary-foreground rounded-full shadow transition-transform ${notificationsEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                      />
                    </button>
                  ) : (
                    <div className="w-11 h-6 bg-muted rounded-full p-0.5">
                      <div className="w-5 h-5 bg-primary-foreground rounded-full shadow" />
                    </div>
                  )
                ) : (
                  <ChevronRight size={20} className="text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="card-elevated w-full flex items-center gap-3 text-red-500"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      <BottomNav />
    </SwipeWrapper>
  );
};

export default Profile;

const ThemeToggle = () => {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={`w-11 h-6 rounded-full p-0.5 transition-colors ${theme === "dark" ? "bg-primary" : "bg-muted"}`}
    >
      <div
        className={`w-5 h-5 bg-primary-foreground rounded-full shadow transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0"
          }`}
      />
    </button>
  );
};

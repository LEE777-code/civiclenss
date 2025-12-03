import { useNavigate } from "react-router-dom";
import { User, FileText, Edit, Moon, Bell, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { useUser, SignOutButton } from "@clerk/clerk-react";
import BottomNav from "@/components/BottomNav";

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const menuItems = [
    { icon: Moon, label: "Dark Mode", type: "toggle" },
    { icon: Bell, label: "Notifications", type: "toggle" },
    { icon: HelpCircle, label: "Help & Support", type: "link" },
  ];

  return (
    <div className="mobile-container min-h-screen bg-muted pb-24">
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
              <p className="text-sm text-muted-foreground">5 Pending, 2 Resolved</p>
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
                  <div className="w-11 h-6 bg-muted rounded-full p-0.5">
                    <div className="w-5 h-5 bg-primary-foreground rounded-full shadow" />
                  </div>
                ) : (
                  <ChevronRight size={20} className="text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <SignOutButton>
          <button
            className="card-elevated w-full flex items-center gap-3 text-red-500"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </SignOutButton>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;

import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  FolderOpen,
  Users,
  UserCircle,
  Globe,
  ChevronLeft,
  ChevronRight,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: FileText, label: "Issues", path: "/admin/issues" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: FolderOpen, label: "Categories", path: "/admin/categories" },
  { icon: Users, label: "Admins", path: "/admin/admins" },
  { icon: UserCircle, label: "Profile", path: "/admin/profile" },
  { icon: Globe, label: "Client View", path: "/client" },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <AlertCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
            <h1 className="text-sm font-bold text-sidebar-foreground">CivicLens</h1>
                <p className="text-xs text-sidebar-foreground/60">Admin Portal</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "sidebar-item",
                  isActive && "sidebar-item-active"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="animate-fade-in">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-sidebar-border p-3">
          <NavLink
            to="/auth/signin"
            className="sidebar-item text-destructive/80 hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="animate-fade-in">Sign Out</span>}
          </NavLink>
        </div>
      </div>
    </aside>
  );
}

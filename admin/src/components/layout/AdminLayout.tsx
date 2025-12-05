import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar />
      <main className="flex-1 ml-64 p-6 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}

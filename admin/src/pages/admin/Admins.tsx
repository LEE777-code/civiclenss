import { Search, Plus, MoreHorizontal, Mail, Shield, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Admin } from "@/lib/supabase";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const roleBadgeStyles = {
  state: "badge-state",
  district: "badge-district",
  local: "badge-local",
  super_admin: "badge-state",
};

const roleLabels = {
  state: "State Admin",
  district: "District Admin",
  local: "Local Body Admin",
  super_admin: "Super Admin",
};

export default function Admins() {
  const [search, setSearch] = useState("");
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const data = await authService.getAllAdmins();
        setAdmins(data);
      } catch (error) {
        console.error("Error fetching admins:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(search.toLowerCase()) ||
      admin.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administrators</h1>
          <p className="text-muted-foreground">
            Manage admin accounts across all jurisdictions.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Admin
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search admins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Admin Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredAdmins.map((admin) => (
          <div
            key={admin.id}
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                  {admin.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{admin.name}</h3>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem className="cursor-pointer">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    Change Role
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Role</span>
                <span className={cn("rounded-full", roleBadgeStyles[admin.role])}>
                  {roleLabels[admin.role]}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">State</span>
                <span className="text-foreground">{admin.state}</span>
              </div>
              {admin.district && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">District</span>
                  <span className="text-foreground">{admin.district}</span>
                </div>
              )}
              {admin.local_body && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Local Body</span>
                  <span className="text-foreground">{admin.local_body}</span>
                </div>
              )}
              {admin.local_body && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Local Body</span>
                  <span className="text-foreground">{admin.local_body}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Joined {new Date(admin.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

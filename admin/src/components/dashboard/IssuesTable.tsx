import { useState } from "react";
import { Search, Filter, MoreHorizontal, Eye, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Issue } from "@/lib/supabase";
import { Report } from "@/services/reportService";
import { issueService } from "@/services/issueService";
import { reportService } from "@/services/reportService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface IssuesTableProps {
  issues: Issue[] | Report[];
  compact?: boolean;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  categoryFilter?: string;
  onCategoryChange?: (value: string) => void;
}

const statusStyles = {
  open: "status-open",
  pending: "status-open",
  "in-progress": "status-progress",
  resolved: "status-resolved",
  rejected: "bg-muted text-muted-foreground",
  escalated: "bg-destructive text-destructive-foreground animate-pulse",
};

const statusLabels = {
  open: "Open",
  pending: "Pending",
  "in-progress": "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
  escalated: "Escalated",
};

const priorityStyles = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
};

// Helper functions to handle both Issue and Report types
const getLocation = (issue: Issue | Report): string => {
  return 'location' in issue ? issue.location : issue.location_name || '';
};

const getPriority = (issue: Issue | Report): 'low' | 'medium' | 'high' => {
  return 'priority' in issue ? issue.priority : issue.severity;
};

const isReport = (issue: Issue | Report): issue is Report => {
  return 'severity' in issue;
};

export function IssuesTable({
  issues,
  compact = false,
  searchQuery = "",
  onSearchChange,
  statusFilter = "all",
  onStatusChange,
  categoryFilter = "all",
  onCategoryChange
}: IssuesTableProps) {
  const { adminEmail } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  // Renaming local state filters to avoid shadowing props if they are used, 
  // but looking at implementation, props might be unused or this component is hybrid.
  // The conflict showed these state variables being added in incoming change.
  // We will keep them as local state for now as per the "Incoming" feature logic.
  const [localStatusFilter, setLocalStatusFilter] = useState<string>("all");
  const [localCategoryFilter, setLocalCategoryFilter] = useState<string>("all");
  const [showAllDepartments, setShowAllDepartments] = useState<boolean>(true); // Default to true for demo flexibility, user requested auto-apply but also "Show All" toggle.
  const [adminDepartment, setAdminDepartment] = useState<string | null>(null);

  // Fetch admin department on mount
  useState(() => {
    const fetchAdminDetails = async () => {
      if (!adminEmail) return;
      const { data } = await supabase.from('admins').select('department').eq('email', adminEmail).single();
      if (data?.department) {
        setAdminDepartment(data.department);
        setShowAllDepartments(false); // Auto-apply filter if department found
      }
    };
    fetchAdminDetails();
  });

  const handleStatusUpdate = async (issue: Issue | Report, newStatus: string) => {
    try {
      let result: boolean | { success: boolean; error?: any } = false;
      if (isReport(issue)) {
        // It's a Report type - pass admin email when resolving
        result = await reportService.updateReportStatus(
          issue.id,
          newStatus as Report['status'],
          adminEmail
        );
      } else {
        // It's an Issue type
        result = await issueService.updateIssueStatus(issue.id, newStatus as Issue['status']);
      }

      const success = typeof result === 'object' ? result.success : result;

      if (success) {
        toast.success("Status updated successfully");
        // Don't reload, let realtime subscription handle the update
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("An error occurred");
    }
  };

  // Delete functionality removed per admin request

  const handleViewDetails = (issue: Issue | Report) => {
    // Navigate to report details page
    navigate(`/admin/issues/${issue.id}`);
  };

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title.toLowerCase().includes(search.toLowerCase()) ||
      issue.id.toLowerCase().includes(search.toLowerCase()) ||
      getLocation(issue).toLowerCase().includes(search.toLowerCase());

    // Check local filters if props are "all" or undefined, otherwise potentially use props?
    // The incoming change used local state: statusFilter, categoryFilter.
    // However, props are named identically.
    // The incoming change shadowed them: `const [statusFilter, setStatusFilter]...`
    // We renamed local state to `localStatusFilter` to avoid linting errors, 
    // so we should use those here.
    const matchesStatus = localStatusFilter === "all" || issue.status === localStatusFilter;
    const matchesCategory = localCategoryFilter === "all" || issue.category === localCategoryFilter;

    // Soft Department Filter
    const matchesDepartment = showAllDepartments || !adminDepartment || issue.category === adminDepartment;

    return matchesSearch && matchesStatus && matchesCategory && matchesDepartment;
  });

  const categories = ["Infrastructure", "Sanitation", "Environment", "Public Safety", "Transportation", "Other"];

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {compact ? "Recent Issues" : "All Issues"}
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

          {/* Department Toggle */}
          {adminDepartment && (
            <div className="flex items-center space-x-2 bg-muted/50 p-1 rounded-lg">
              <button
                onClick={() => setShowAllDepartments(false)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  !showAllDepartments ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"
                )}
              >
                My Dept ({adminDepartment})
              </button>
              <button
                onClick={() => setShowAllDepartments(true)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  showAllDepartments ? "bg-background text-foreground shadow-sm border" : "hover:bg-muted text-muted-foreground"
                )}
              >
                Show All
              </button>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search issues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          {!compact && (
            <>
              <Select value={localStatusFilter} onValueChange={setLocalStatusFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={localCategoryFilter} onValueChange={setLocalCategoryFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Issue ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              {!compact && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Location
                  </th>
                </>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date
              </th>
              {!compact && (
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status/SLA
                </th>
              )}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredIssues.slice(0, compact ? 5 : undefined).map((issue) => (
              <tr key={issue.id} className="table-row-hover">
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-primary">
                  {issue.id}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  <div className="max-w-xs truncate">{issue.title}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                  {issue.category}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusStyles[issue.status]
                    )}
                  >
                    {statusLabels[issue.status]}
                  </span>
                </td>
                {!compact && (
                  <>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          priorityStyles[getPriority(issue)]
                        )}
                      >
                        {getPriority(issue)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div className="max-w-xs truncate">{getLocation(issue)}</div>
                    </td>
                  </>
                )}
                <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                  {new Date(issue.created_at).toLocaleDateString()}
                </td>
                {!compact && (
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {isReport(issue) && issue.escalated && (
                      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                        Escalated
                      </span>
                    )}
                    {isReport(issue) && !issue.escalated && issue.deadline && (
                      <span className={cn(
                        "text-xs",
                        new Date(issue.deadline) < new Date() ? "text-destructive font-bold" : "text-muted-foreground"
                      )}>
                        {new Date(issue.deadline) < new Date() ? "Overdue" : `Due: ${new Date(issue.deadline).toLocaleDateString()}`}
                      </span>
                    )}
                  </td>
                )}
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => handleViewDetails(issue)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => handleStatusUpdate(issue, 'in-progress')}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Mark In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => handleStatusUpdate(issue, 'resolved')}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Mark Resolved
                      </DropdownMenuItem>
                      {/* Delete option removed */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredIssues.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No issues found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

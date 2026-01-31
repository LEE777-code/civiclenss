import { MapPin, Calendar, User, ThumbsUp, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Issue } from "@/lib/supabase";
import { Report } from "@/services/reportService";

interface IssueSummaryPanelProps {
  issue: Issue | Report;
}

const statusStyles = {
  open: "bg-destructive text-destructive-foreground",
  pending: "bg-destructive text-destructive-foreground", // Map pending to same as open
  "in-progress": "bg-warning text-warning-foreground",
  resolved: "bg-success text-success-foreground",
  rejected: "bg-muted text-muted-foreground",
};

const statusLabels = {
  open: "Open",
  pending: "Pending",
  "in-progress": "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

// Helper functions
const getLocation = (issue: Issue | Report): string => {
  return 'location' in issue ? issue.location : issue.location_name || '';
};

const isReport = (issue: Issue | Report): issue is Report => {
  return 'severity' in issue;
};

const isAnonymous = (issue: Issue | Report): boolean => {
  return 'is_anonymous' in issue ? issue.is_anonymous : false;
};

const getReporterName = (issue: Issue | Report): string => {
  if ('user' in issue && issue.user?.full_name) {
    return issue.user.full_name;
  }
  if ('reporter_name' in issue) {
    return issue.reporter_name || 'Unknown';
  }
  return 'Unknown';
};

export function IssueSummaryPanel({ issue }: IssueSummaryPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{issue.id}</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">{issue.title}</h3>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            statusStyles[issue.status]
          )}
        >
          {statusLabels[issue.status]}
        </span>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{issue.description}</p>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{getLocation(issue)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{issue.category}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">
            {isAnonymous(issue) ? "Anonymous" : getReporterName(issue)}
            {('user' in issue && issue.user?.phone_number) && (
              <span className="ml-2 text-xs text-muted-foreground">({issue.user.phone_number})</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">
            {new Date(issue.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{issue.upvotes} upvotes</span>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button className="flex-1" variant="default">
          Update Status
        </Button>
        <Button className="flex-1" variant="outline">
          View Details
        </Button>
      </div>
    </div>
  );
}

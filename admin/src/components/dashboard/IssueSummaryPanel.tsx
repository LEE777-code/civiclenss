import { MapPin, Calendar, User, ThumbsUp, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Issue } from "@/lib/supabase";

interface IssueSummaryPanelProps {
  issue: Issue;
}

const statusStyles = {
  open: "bg-destructive text-destructive-foreground",
  "in-progress": "bg-warning text-warning-foreground",
  resolved: "bg-success text-success-foreground",
  rejected: "bg-muted text-muted-foreground",
};

const statusLabels = {
  open: "Open",
  "in-progress": "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
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
          <span className="text-foreground">{issue.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{issue.category}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">
            {issue.is_anonymous ? "Anonymous" : (issue.reporter_name || "Unknown")}
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

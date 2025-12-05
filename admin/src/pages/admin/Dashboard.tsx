import { useEffect, useState } from "react";
import { FileText, AlertTriangle, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { IssuesTable } from "@/components/dashboard/IssuesTable";
import { IssueSummaryPanel } from "@/components/dashboard/IssueSummaryPanel";
import { Issue } from "@/lib/supabase";
import { issueService, IssueStats } from "@/services/issueService";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { admin } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<IssueStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [issuesData, statsData] = await Promise.all([
          issueService.getRecentIssues(10),
          issueService.getIssueStats(),
        ]);
        setIssues(issuesData);
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedIssue = issues[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {admin?.name || "Admin"}
        </h1>
        <p className="text-muted-foreground">
          You are managing issues for <span className="font-medium text-primary">{admin?.state || "your jurisdiction"}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Issues"
          value={stats?.total || 0}
          icon={FileText}
          variant="primary"
        />
        <StatCard
          title="Open Issues"
          value={stats?.open || 0}
          icon={AlertTriangle}
          variant="destructive"
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgress || 0}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Resolved"
          value={stats?.resolved || 0}
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Issues Table */}
        <div className="lg:col-span-2">
          <IssuesTable issues={issues} compact />
        </div>

        {/* Issue Summary Panel */}
        {selectedIssue && (
          <div className="lg:col-span-1">
            <IssueSummaryPanel issue={selectedIssue} />
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { FileText, AlertTriangle, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { IssuesTable } from "@/components/dashboard/IssuesTable";
import { IssueSummaryPanel } from "@/components/dashboard/IssueSummaryPanel";
import { Report, reportService, ReportStats } from "@/services/reportService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export default function Dashboard() {
  const { adminEmail } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [reportsData, statsData] = await Promise.all([
        reportService.getRecentReports(10),
        reportService.getDashboardStats(),
      ]);
      setReports(reportsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useRealtimeSubscription({
    channelName: 'dashboard-reports',
    table: 'reports',
    onChange: () => {
      fetchData();
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedReport = reports[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, Admin
        </h1>
        <p className="text-muted-foreground">
          You are managing reports for <span className="font-medium text-primary">your jurisdiction</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Reports"
          value={stats?.total || 0}
          icon={FileText}
          variant="primary"
        />
        <StatCard
          title="Pending"
          value={stats?.pending || 0}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Resolved"
          value={stats?.resolved || 0}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Rejected"
          value={stats?.rejected || 0}
          icon={AlertTriangle}
          variant="destructive"
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Reports Table */}
        <div className="lg:col-span-2">
          <IssuesTable issues={reports} compact />
        </div>

        {/* Report Summary Panel */}
        {selectedReport && (
          <div className="lg:col-span-1">
            <IssueSummaryPanel issue={selectedReport} />
          </div>
        )}
      </div>
    </div>
  );
}


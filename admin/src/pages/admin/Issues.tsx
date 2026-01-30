import { useEffect, useState } from "react";
import { IssuesTable } from "@/components/dashboard/IssuesTable";
import { Report, reportService } from "@/services/reportService";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export default function Issues() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const data = await reportService.getReports();
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useRealtimeSubscription({
    channelName: 'issues-reports',
    table: 'reports',
    onChange: () => {
      fetchReports();
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Reports Management</h1>
        <p className="text-muted-foreground">
          View and manage all reported civic issues in your jurisdiction.
        </p>
      </div>

      <IssuesTable issues={reports} />
    </div>
  );
}


import { useEffect, useState } from "react";
import { IssuesTable } from "@/components/dashboard/IssuesTable";
import { Issue } from "@/lib/supabase";
import { issueService } from "@/services/issueService";
import { Loader2 } from "lucide-react";

export default function Issues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const data = await issueService.getIssues();
        setIssues(data);
      } catch (error) {
        console.error("Error fetching issues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

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
        <h1 className="text-2xl font-bold text-foreground">Issues Management</h1>
        <p className="text-muted-foreground">
          View and manage all reported civic issues in your jurisdiction.
        </p>
      </div>

      <IssuesTable issues={issues} />
    </div>
  );
}

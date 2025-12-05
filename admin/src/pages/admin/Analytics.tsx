import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { issueService, IssueStats } from "@/services/issueService";
import { Issue } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const COLORS = ["#0D9488", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6"];

export default function Analytics() {
  const [stats, setStats] = useState<IssueStats | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [statsData, issuesData] = await Promise.all([
          issueService.getIssueStats(),
          issueService.getIssues(),
        ]);
        setStats(statsData);
        setIssues(issuesData);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Process data for charts
  const categoryData = stats?.byCategory
    ? Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }))
    : [];

  // Generate monthly trend from issues
  const monthlyTrend = issues.reduce((acc: { month: string; reported: number; resolved: number }[], issue: Issue) => {
    const month = new Date(issue.created_at).toLocaleDateString("en-US", { month: "short" });
    const existing = acc.find((item) => item.month === month);

    if (existing) {
      existing.reported += 1;
      if (issue.status === "resolved") existing.resolved += 1;
    } else {
      acc.push({
        month,
        reported: 1,
        resolved: issue.status === "resolved" ? 1 : 0,
      });
    }

    return acc;
  }, []).slice(-6);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights and trends for civic issues.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="reported"
                stackId="1"
                stroke="hsl(var(--chart-4))"
                fill="hsl(var(--chart-4) / 0.3)"
                name="Reported"
              />
              <Area
                type="monotone"
                dataKey="resolved"
                stackId="2"
                stroke="hsl(var(--chart-2))"
                fill="hsl(var(--chart-2) / 0.3)"
                name="Resolved"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Issues by Category Pie Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Issues by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Reported vs Resolved</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="reported" fill="hsl(var(--chart-1))" name="Reported" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="hsl(var(--chart-2))" name="Resolved" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

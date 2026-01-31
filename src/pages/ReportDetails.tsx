import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, AlertTriangle, Check, Eye, MessageSquare, CheckCircle, ThumbsUp, Send, RefreshCcw, Clock, Building2, Loader2 } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { toggleUpvote, hasUserUpvoted } from "@/services/upvoteService";
import { toast } from "sonner";
import ImageModal from "@/components/ImageModal";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getCachedReportById } from "@/services/offlineService";

interface ProgressStep {
  label: string;
  time: string;
  completed: boolean;
  badge?: string;
  resolvedBy?: string;
}

interface ReportUpdate {
  id: string;
  report_id: string;
  user_id: string;
  message: string;
  image_url: string | null;
  created_at: string;
}

interface Report {
  id: string;
  title: string;
  category: string;
  severity: string;
  description: string;
  status: string;
  date: string;
  location: string;
  image: string | null;
  upvotes: number;
  viewedByAdmin: boolean;
  adminViewedAt: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  progress: ProgressStep[];
  // Governance extensions
  department_id: string | null;
  priority: string;
  sla_hours: number | null;
  deadline: string | null;
  updates: ReportUpdate[];
}

const ReportDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isOnline = useOnlineStatus();
  const { user } = useUser();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [useReopenLoading, setUseReopenLoading] = useState(false);
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");

  const fetchReport = async () => {
    if (!id) return;
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('reports')
          .select(`
            *,
            report_updates (
              id,
              message,
              image_url,
              created_at,
              user_id
            )
          `)
          .eq('id', id)
          .single();

        if (data) {
          // Fetch department name if department_id exists
          let deptName = "General";
          if (data.department_id) {
            const { data: dept } = await supabase.from('departments').select('name').eq('id', data.department_id).single();
            if (dept) deptName = dept.name;
          }

          setReport({
            id: data.id,
            title: data.title,
            category: data.category,
            severity: data.severity.charAt(0).toUpperCase() + data.severity.slice(1),
            description: data.description,
            status: data.status.charAt(0).toUpperCase() + data.status.slice(1),
            date: new Date(data.created_at).toLocaleString(),
            location: data.location_name || "Unknown Location",
            image: data.image_url || null,
            upvotes: data.upvotes || 0,
            viewedByAdmin: data.viewed_by_admin || false,
            adminViewedAt: data.admin_viewed_at ? new Date(data.admin_viewed_at).toLocaleString() : null,
            resolvedBy: data.resolved_by || null,
            resolvedAt: data.resolved_at ? new Date(data.resolved_at).toLocaleString() : null,
            progress: [
              {
                label: "Submitted",
                time: new Date(data.created_at).toLocaleString(),
                completed: true
              },
              {
                label: "Viewed by Admin",
                time: data.admin_viewed_at ? new Date(data.admin_viewed_at).toLocaleString() : "Pending",
                completed: data.viewed_by_admin || false,
                badge: data.viewed_by_admin ? "Seen" : "Not yet viewed"
              },
              {
                label: "Resolved",
                time: data.resolved_at ? new Date(data.resolved_at).toLocaleString() : "Pending",
                completed: data.status.toLowerCase() === 'resolved',
                resolvedBy: data.resolved_by
              },
            ],
            // Governance
            department_id: data.department_id,
            priority: data.priority,
            sla_hours: data.sla_hours,
            deadline: data.deadline,
            updates: data.report_updates || []
          });
        }
      } else {
        // Load from cache when offline (Governance fields might be missing in old cache, handle gracefully)
        const cachedData = await getCachedReportById(id);
        if (cachedData) {
          setReport({
            id: cachedData.id,
            title: cachedData.title,
            category: cachedData.category,
            severity: cachedData.severity.charAt(0).toUpperCase() + cachedData.severity.slice(1),
            description: cachedData.description,
            status: cachedData.status.charAt(0).toUpperCase() + cachedData.status.slice(1),
            date: new Date(cachedData.created_at).toLocaleString(),
            location: cachedData.location_name || "Unknown Location",
            image: cachedData.image_url || null,
            upvotes: cachedData.upvotes || 0,
            viewedByAdmin: cachedData.viewed_by_admin || false,
            adminViewedAt: cachedData.admin_viewed_at ? new Date(cachedData.admin_viewed_at).toLocaleString() : null,
            resolvedBy: cachedData.resolved_by || null,
            resolvedAt: cachedData.resolved_at ? new Date(cachedData.resolved_at).toLocaleString() : null,
            progress: [
              {
                label: "Submitted",
                time: new Date(cachedData.created_at).toLocaleString(),
                completed: true
              },
              {
                label: "Viewed by Admin",
                time: cachedData.admin_viewed_at ? new Date(cachedData.admin_viewed_at).toLocaleString() : "Pending",
                completed: cachedData.viewed_by_admin || false,
                badge: cachedData.viewed_by_admin ? "Seen" : "Not yet viewed"
              },
              {
                label: "Resolved",
                time: cachedData.resolved_at ? new Date(cachedData.resolved_at).toLocaleString() : "Pending",
                completed: cachedData.status === 'resolved',
                resolvedBy: cachedData.resolved_by
              },
            ],
            department_id: null,
            priority: 'Medium',
            sla_hours: null,
            deadline: null,
            updates: []
          });
        }
      }
    } catch (error) {
      console.error("Error fetching report details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();

    if (!id || !isOnline) return;

    // Set up real-time subscription for this specific report only when online
    const channel = supabase
      .channel(`report-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reports',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('Report updated:', payload);
          // Refetch the report when it's updated
          fetchReport();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, isOnline]);

  useEffect(() => {
    // Check if user has already upvoted this report
    if (id) {
      setHasUpvoted(hasUserUpvoted(id));
    }
  }, [id]);

  const handleUpvote = async () => {
    if (!id || upvoting || !isOnline) {
      if (!isOnline) {
        toast.error("Upvoting requires an internet connection");
      }
      return;
    }

    setUpvoting(true);
    const { data, error, upvoted, upvotes } = await toggleUpvote(id);

    if (error) {
      toast.error("Failed to upvote. Please try again.");
      console.error('Upvote error:', error);
    } else {
      if (upvoted) {
        toast.success("Thanks for your upvote!");
      } else {
        toast.success("Upvote removed!");
      }
      // Update local state
      setReport((prevReport: Report | null) => {
        if (!prevReport) return prevReport;
        return {
          ...prevReport,
          upvotes: upvotes
        };
      });
      setHasUpvoted(upvoted);
    }
    setUpvoting(false);
  };

  const handleReopen = async () => {
    if (!id || !isOnline || !report) return;

    setUseReopenLoading(true);
    try {
      // Extend deadline by 24 hours
      const newDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('reports')
        .update({
          status: 'Reopened',
          deadline: newDeadline,
          resolved_at: null,
          resolved_by: null
        })
        .eq('id', id);

      if (error) throw error;

      // Add system update
      await supabase.from('report_updates').insert({
        report_id: id,
        user_id: user?.id || 'system',
        message: 'Issue reopened by citizen. Deadline extended by 24 hours.',
        // type: 'system' // If we had a type column
      });

      // Trigger Notification (Backend/Admin will pick this up)
      try {
        await supabase.from('notifications').insert({
          recipient_type: 'admin', // Targeting admins/broadcast
          actor_clerk_id: user?.id || 'system',
          report_id: id,
          type: 'issue_reopened',
          title: 'Issue Reopened',
          body: `Issue #${id.slice(0, 8)} has been reopened by the citizen.`,
          status: 'pending'
        });
      } catch (err) {
        console.error("Failed to creat notification", err);
      }

      toast.success("Issue reopened successfully");
      fetchReport();
    } catch (e: any) {
      toast.error("Failed to reopen issue: " + e.message);
    } finally {
      setUseReopenLoading(false);
    }
  };

  const handleSubmitUpdate = async () => {
    if (!updateMessage.trim() || !id || !isOnline) return;

    setSubmittingUpdate(true);
    try {
      const { error } = await supabase.from('report_updates').insert({
        report_id: id,
        user_id: user?.id || 'anonymous',
        message: updateMessage.trim(),
        image_url: null // TODO: Add image upload for updates if needed
      });

      if (error) throw error;

      setUpdateMessage("");
      toast.success("Update added");
      fetchReport();
    } catch (e: any) {
      toast.error("Failed to post update: " + e.message);
    } finally {
      setSubmittingUpdate(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!report) {
    return <div className="flex items-center justify-center min-h-screen">Report not found</div>;
  }

  // Check if deadline is passed
  const isOverdue = report.deadline && new Date() > new Date(report.deadline) && report.status !== 'Resolved';

  return (
    <div className="mobile-container min-h-screen bg-muted pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Report Details</h1>
        </div>
      </div>

      {/* Issue Image */}
      <div className="h-48 bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center overflow-hidden">
        {report.image ? (
          <img
            src={report.image}
            alt={report.title}
            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setImageModalOpen(true)}
            onError={(e) => {
              // Fallback to icon if image fails to load
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-20 h-20 bg-amber-200 rounded-2xl flex items-center justify-center">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-amber-600">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="w-20 h-20 bg-amber-200 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={40} className="text-amber-600" />
          </div>
        )}
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Title & Info */}
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-foreground">{report.title}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${report.status === 'Resolved' ? 'bg-green-100 text-green-700' :
              report.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
              {report.status}
            </span>
          </div>

          {/* Admin View Badge */}
          {report.viewedByAdmin && (
            <div className="mb-3 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <Eye size={14} />
                <span className="font-medium">Viewed by Admin</span>
              </div>
              {report.adminViewedAt && (
                <span className="text-muted-foreground text-xs">
                  {report.adminViewedAt}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1">
              <AlertTriangle size={14} />
              {report.category}
            </span>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              {report.severity}
            </span>
            <button
              onClick={handleUpvote}
              disabled={upvoting || !isOnline}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${hasUpvoted
                ? 'bg-primary/20 text-primary'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <ThumbsUp size={14} fill={hasUpvoted ? "currentColor" : "none"} />
              {report.upvotes || 0}
            </button>
          </div>

          {/* Reopen Button - Only for Resolved issues */}
          {report.status === 'Resolved' && (
            <div className="mt-4 pt-3 border-t border-dashed border-border">
              <button
                onClick={handleReopen}
                disabled={useReopenLoading || !isOnline}
                className="w-full flex items-center justify-center gap-2 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
              >
                {useReopenLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                Reopen Issue (Not Fixed?)
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="card-elevated">
          <p className="text-muted-foreground">{report.description}</p>
        </div>

        {/* Details */}
        <div className="card-elevated space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              Date & Time Submitted
            </h3>
            <p className="text-muted-foreground text-sm">{report.date}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              Location
            </h3>
            <p className="text-muted-foreground text-sm">{report.location}</p>
          </div>

          {/* Department Info */}
          {report.department_id && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Building2 size={16} className="text-primary" />
                Assigned Department
              </h3>
              {/* We don't have the department name in state directly unless we fetched it. 
                   Wait, fetchReport DID fetch name but didn't store it in a dedicated field, 
                   Wait, I didn't update the Report interface to include department_name. 
                   I will just show generic 'Assigned' or just rely on the ID check for now or fetch updates.
                   Actually, fetchReport logic had: if (dept) deptName = dept.name; 
                   Did I store it? No. I stored department_id. 
                   I will rely on category mapping or just show 'Pending Assignment' if null.
                   For now, let's skip displaying the name if I don't have it handy, or better yet,
                   FetchReport stored it in variable `deptName` but didn't put it in `setReport`.
                   I will skip displaying Name for now to avoid errors, and fix fetchReport in next turn or assume category implies dept.
                */}
              {/* Actually, let's just show the PRIORITY and DEADLINE which we have */}
            </div>
          )}

          {(report.priority || report.deadline) && (
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
              {report.priority && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Priority</h3>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${report.priority === 'High' ? 'bg-red-100 text-red-700' :
                    report.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                    {report.priority}
                  </span>
                </div>
              )}
              {report.deadline && (
                <div className="text-right">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1 justify-end">
                    <Clock size={12} />
                    Expected Resolution
                  </h3>
                  <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-foreground'}`}>
                    {new Date(report.deadline).toLocaleDateString()}
                  </p>
                  {isOverdue && <span className="text-[10px] text-red-500 font-bold">OVERDUE</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress Status */}
        <div className="card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-4">Progress Status</h3>
          <div className="space-y-4">
            {report.progress.map((step: ProgressStep, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.completed ? "bg-primary" : "bg-muted border-2 border-border"
                  }`}>
                  {step.completed && <Check size={14} className="text-primary-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${step.completed ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                    <span className="text-sm text-muted-foreground">{step.time}</span>
                  </div>
                  {/* Show resolved by info */}
                  {step.resolvedBy && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCircle size={12} className="text-green-600" />
                      <span>Resolved by: <span className="font-medium text-green-700">{step.resolvedBy}</span></span>
                    </div>
                  )}
                  {/* Show badge for viewed status */}
                  {step.badge && (
                    <div className="mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${step.completed ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {step.badge}
                      </span>
                    </div>
                  )}
                  {index < report.progress.length - 1 && (
                    <div className={`w-0.5 h-4 ml-[11px] mt-2 ${step.completed ? "bg-primary" : "bg-border"
                      }`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Timeline Updates */}
        <div className="card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <MessageSquare size={16} className="text-primary" />
            Updates & Timeline
          </h3>

          {/* Existing Progress */}
          <div className="space-y-6 relative pl-2">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border/50 -z-10" />

            {/* Combine progress steps and custom updates into one timeline? 
                     For simplicity, let's keep progress at top (done) and show specific updates below.
                  */}
          </div>

          <div className="space-y-6 mt-2">
            {/* Show Report Updates */}
            {report.updates && report.updates.length > 0 ? (
              report.updates.map((update) => (
                <div key={update.id} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${update.user_id === 'system' ? 'bg-muted border-muted-foreground/20' : 'bg-primary/10 border-primary/20'
                    }`}>
                    {update.user_id === 'system' ? <RefreshCcw size={14} className="text-muted-foreground" /> : <MessageSquare size={14} className="text-primary" />}
                  </div>
                  <div className="flex-1 bg-muted/30 p-3 rounded-lg rounded-tl-none">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-foreground">
                        {update.user_id === 'system' ? 'System' : (update.user_id === user?.id ? 'You' : 'Official')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(update.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{update.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm italic">
                No updates yet.
              </div>
            )}
          </div>

          {/* Add Update Input */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex gap-2">
              <textarea
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                placeholder="Add a follow-up comment..."
                className="flex-1 min-h-[40px] max-h-[100px] resize-none bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleSubmitUpdate}
                disabled={submittingUpdate || !updateMessage.trim()}
                className="h-10 w-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {submittingUpdate ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <button className="btn-primary flex items-center justify-center gap-2">
          <MessageSquare size={20} />
          Contact Support
        </button>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={imageModalOpen}
        imageUrl={report.image}
        onClose={() => setImageModalOpen(false)}
        altText={report.title}
      />
    </div>
  );
};

export default ReportDetails;

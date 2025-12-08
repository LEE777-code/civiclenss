import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, AlertTriangle, Check, Eye, MessageSquare, CheckCircle, ThumbsUp } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { toggleUpvote, hasUserUpvoted } from "@/services/upvoteService";
import { toast } from "sonner";

const ReportDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upvoting, setUpvoting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const fetchReport = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setReport({
          id: data.id,
          title: data.title,
          category: data.category,
          severity: data.severity.charAt(0).toUpperCase() + data.severity.slice(1),
          description: data.description,
          status: data.status.charAt(0).toUpperCase() + data.status.slice(1),
          date: new Date(data.created_at).toLocaleString(),
          location: data.location_name || "Unknown Location",
          image: data.image_url || null, // Add the image URL
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
              completed: data.status === 'resolved',
              resolvedBy: data.resolved_by
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error fetching report details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();

    if (!id) return;

    // Set up real-time subscription for this specific report
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
  }, [id]);

  useEffect(() => {
    // Check if user has already upvoted this report
    if (id) {
      setHasUpvoted(hasUserUpvoted(id));
    }
  }, [id]);

  const handleUpvote = async () => {
    if (!id || upvoting) return;

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
      setReport((prevReport: any) => ({
        ...prevReport,
        upvotes: upvotes
      }));
      setHasUpvoted(upvoted);
    }
    setUpvoting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!report) {
    return <div className="flex items-center justify-center min-h-screen">Report not found</div>;
  }

  return (
    <div className="mobile-container min-h-screen bg-muted">
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
            className="w-full h-full object-cover"
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
              disabled={upvoting}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                hasUpvoted
                  ? 'bg-primary/20 text-primary'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ThumbsUp size={14} fill={hasUpvoted ? "currentColor" : "none"} />
              {report.upvotes || 0}
            </button>
          </div>
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
        </div>

        {/* Progress Status */}
        <div className="card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-4">Progress Status</h3>
          <div className="space-y-4">
            {report.progress.map((step: any, index: number) => (
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

        {/* Contact Support */}
        <button className="btn-primary flex items-center justify-center gap-2">
          <MessageSquare size={20} />
          Contact Support
        </button>
      </div>
    </div>
  );
};

export default ReportDetails;

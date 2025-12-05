import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, AlertTriangle, Check, Eye, MessageSquare } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

const ReportDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            date: new Date(data.created_at).toLocaleString(),
            location: data.location_name || "Unknown Location",
            progress: [
              { label: "Submitted", time: new Date(data.created_at).toLocaleString(), completed: true },
              { label: "Viewed by Admin", time: "Pending", completed: data.status !== 'pending' },
              { label: "Resolved", time: "Pending", completed: data.status === 'resolved' },
            ],
          });
        }
      } catch (error) {
        console.error("Error fetching report details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

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

      {/* Issue Image Placeholder */}
      <div className="h-48 bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
        <div className="w-20 h-20 bg-amber-200 rounded-2xl flex items-center justify-center">
          <AlertTriangle size={40} className="text-amber-600" />
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Title & Info */}
        <div className="card-elevated">
          <h2 className="text-xl font-bold text-foreground mb-2">{report.title}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1">
              <AlertTriangle size={14} />
              {report.category}
            </span>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              {report.severity}
            </span>
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
            {report.progress.map((step, index) => (
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

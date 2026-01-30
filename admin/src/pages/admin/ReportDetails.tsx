import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, User, Tag, AlertCircle, CheckCircle2, XCircle, Clock, Loader2, Eye, Send, Mail } from "lucide-react";
import { reportService, Report } from "@/services/reportService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { getOfficers, assignOfficerToReport, Officer } from "@/services/officerService";
import { assignReportViaWhatsApp } from "@/services/whatsappService";
import { assignReportViaEmail } from "@/services/emailService";

export default function ReportDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { adminEmail } = useAuth();
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [showResolveDialog, setShowResolveDialog] = useState(false);
    const [proofImage, setProofImage] = useState<File | null>(null);
    const [proofImagePreview, setProofImagePreview] = useState<string | null>(null);

    // Restoring missing state variables
    const [updating, setUpdating] = useState(false);
    const [officers, setOfficers] = useState<Officer[]>([]);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);

    const fetchReport = async () => {
        if (!id) return;

        try {
            const data = await reportService.getReportById(id);
            if (data) {
                setReport(data);
                // Mark as viewed by admin
                await reportService.markAsViewedByAdmin(id);
            } else {
                toast.error("Report not found");
                navigate("/admin/issues");
            }
        } catch (error) {
            console.error("Error fetching report:", error);
            toast.error("Failed to load report");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
        loadOfficers(); // Load officers list
    }, [id]);

    useRealtimeSubscription({
        channelName: `admin-report-${id}`,
        table: 'reports',
        event: 'UPDATE',
        filter: id ? `id=eq.${id}` : undefined,
        enabled: !!id,
        onChange: () => {
            fetchReport();
        },
    });

    const handleProofImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProofImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProofImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleResolveReport = async () => {
        if (!report) return;

        if (!proofImagePreview) {
            toast.error("Please upload a proof image to resolve this issue.");
            return;
        }

        setUpdating(true);
        try {
            // Reverted to client-side update with Base64 image
            // We pass the Base64 string directly as the resolvedImageUrl
            const result = await reportService.updateReportStatus(
                report.id,
                'resolved',
                adminEmail,
                proofImagePreview
            );

            if (result.success) {
                toast.success("Report marked as resolved with proof!");
                setShowResolveDialog(false);
                setProofImage(null);
                setProofImagePreview(null);
                // The real-time subscription will update the UI
            } else {
                toast.error("Failed to update status: " + (result.error?.message || "Unknown error"));
            }
        } catch (error: any) {
            console.error("Error resolving report:", error);
            toast.error("An error occurred");
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateStatus = async (newStatus: Report['status']) => {
        if (!report) return;

        if (newStatus === 'resolved') {
            setShowResolveDialog(true);
            return;
        }

        setUpdating(true);
        try {
            const result = await reportService.updateReportStatus(report.id, newStatus, adminEmail);

            if (result.success) {
                toast.success(`Report marked as ${newStatus}`);
                // The real-time subscription will update the UI
            } else {
                toast.error("Failed to update status: " + (result.error?.message || "Unknown error"));
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("An error occurred");
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdateSeverity = async (newSeverity: Report['severity']) => {
        if (!report) return;

        setUpdating(true);
        try {
            const success = await reportService.updateReportSeverity(report.id, newSeverity);

            if (success) {
                toast.success(`Severity updated to ${newSeverity}`);
            } else {
                toast.error("Failed to update severity");
            }
        } catch (error) {
            console.error("Error updating severity:", error);
            toast.error("An error occurred");
        } finally {
            setUpdating(false);
        }
    };

    const loadOfficers = async () => {
        const officersList = await getOfficers();
        setOfficers(officersList);
    };

    const handleAssignOfficer = async () => {
        if (!selectedOfficer || !report || !adminEmail) return;

        try {
            // Save assignment to database
            const success = await assignOfficerToReport(report.id, selectedOfficer.id, adminEmail);

            if (success) {
                // Open WhatsApp with pre-filled message
                const whatsappData = {
                    id: report.id,
                    title: report.title,
                    category: report.category,
                    severity: report.severity,
                    description: report.description || '',
                    location_name: report.location_name || '',
                    latitude: report.latitude,
                    longitude: report.longitude,
                    image_url: report.image_url,
                    created_at: report.created_at || new Date().toISOString(),
                };

                assignReportViaWhatsApp(selectedOfficer, whatsappData);

                toast.success(`Report assigned to ${selectedOfficer.name}. WhatsApp opened!`);
                setShowAssignDialog(false);
                setSelectedOfficer(null);

                // Refresh report to show assignment
                fetchReport();
            } else {
                toast.error("Failed to assign officer");
            }
        } catch (error) {
            console.error("Error assigning officer:", error);
            toast.error("An error occurred");
        }
    };

    const handleAssignOfficerEmail = async () => {
        if (!selectedOfficer || !report || !adminEmail) return;

        try {
            setUpdating(true);
            toast.info("Sending email...");

            // Save assignment to database
            const success = await assignOfficerToReport(report.id, selectedOfficer.id, adminEmail);

            if (success) {
                // Send email via Resend backend
                const emailData = {
                    id: report.id,
                    title: report.title,
                    category: report.category,
                    severity: report.severity,
                    description: report.description || '',
                    location_name: report.location_name || '',
                    latitude: report.latitude,
                    longitude: report.longitude,
                    image_url: report.image_url,
                    created_at: report.created_at || new Date().toISOString(),
                };

                const result = await assignReportViaEmail(selectedOfficer, emailData, adminEmail);

                if (result.success) {
                    toast.success(`Email sent to ${selectedOfficer.name} successfully!`);
                    setShowAssignDialog(false);
                    setSelectedOfficer(null);
                    fetchReport();
                } else {
                    toast.error(result.error || "Failed to send email");
                }
            } else {
                toast.error("Failed to assign officer");
            }
        } catch (error) {
            console.error("Error assigning officer:", error);
            toast.error("An error occurred");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Report not found</p>
                <Button onClick={() => navigate("/admin/issues")} className="mt-4">
                    Back to Reports
                </Button>
            </div>
        );
    }

    const statusColors = {
        pending: "bg-amber-500",
        resolved: "bg-green-500",
        rejected: "bg-red-500",
    };

    const severityColors = {
        low: "text-green-600 bg-green-50",
        medium: "text-amber-600 bg-amber-50",
        high: "text-red-600 bg-red-50",
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/admin/issues")}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Report Details</h1>
                        <p className="text-sm text-muted-foreground">ID: {report.id}</p>
                    </div>
                </div>

                {report.viewed_by_admin && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                        <Eye className="h-4 w-4" />
                        <span>Viewed by Admin</span>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Report Card */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <h2 className="text-xl font-semibold text-foreground">{report.title}</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[report.status]} text-white`}>
                                {report.status}
                            </span>
                        </div>

                        {report.description && (
                            <p className="text-muted-foreground mb-4">{report.description}</p>
                        )}

                        {/* Image */}
                        {report.image_url && (
                            <div className="mb-4">
                                <h3 className="text-sm font-medium mb-2">Report Image</h3>
                                <img
                                    src={report.image_url}
                                    alt="Report"
                                    className="w-full max-h-96 object-contain rounded-lg border border-border bg-gray-50"
                                />
                            </div>
                        )}

                        {/* Resolution Proof */}
                        {report.resolved_image_url && (
                            <div className="mb-4 pt-4 border-t border-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <h3 className="text-sm font-medium">Resolution Proof</h3>
                                </div>
                                <img
                                    src={report.resolved_image_url}
                                    alt="Resolution Proof"
                                    className="w-full max-h-96 object-contain rounded-lg border border-border bg-gray-50"
                                />
                            </div>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Category</p>
                                    <p className="font-medium text-foreground">{report.category}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Severity</p>
                                    <p className={`font-medium capitalize px-2 py-0.5 rounded ${severityColors[report.severity]}`}>
                                        {report.severity}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Location</p>
                                    <p className="font-medium text-foreground">{report.location_name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Submitted</p>
                                    <p className="font-medium text-foreground">
                                        {new Date(report.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Reporter</p>
                                    <p className="font-medium text-foreground">{report.user_id}</p>
                                </div>
                            </div>

                            {report.resolved_at && (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Resolved</p>
                                        <p className="font-medium text-foreground">
                                            {new Date(report.resolved_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {report.resolved_by && (
                                <div className="flex items-center gap-2 col-span-2">
                                    <User className="h-4 w-4 text-green-600" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Resolved By</p>
                                        <p className="font-medium text-green-700">{report.resolved_by}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Sidebar */}
                <div className="space-y-6">
                    {/* Status Actions */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h3 className="font-semibold text-foreground mb-4">Update Status</h3>
                        <div className="space-y-2">
                            <Button
                                onClick={() => handleUpdateStatus('resolved')}
                                disabled={updating || report.status === 'resolved'}
                                variant={report.status === 'resolved' ? 'default' : 'outline'}
                                className="w-full justify-start"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark as Resolved
                            </Button>
                            <Button
                                onClick={() => handleUpdateStatus('rejected')}
                                disabled={updating || report.status === 'rejected'}
                                variant={report.status === 'rejected' ? 'destructive' : 'outline'}
                                className="w-full justify-start"
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Mark as Rejected
                            </Button>
                        </div>
                    </div>

                    {/* Severity Actions */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h3 className="font-semibold text-foreground mb-4">Update Severity</h3>
                        <div className="space-y-2">
                            <Button
                                onClick={() => handleUpdateSeverity('low')}
                                disabled={updating || report.severity === 'low'}
                                variant={report.severity === 'low' ? 'default' : 'outline'}
                                className="w-full justify-start"
                            >
                                <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
                                Low Priority
                            </Button>
                            <Button
                                onClick={() => handleUpdateSeverity('medium')}
                                disabled={updating || report.severity === 'medium'}
                                variant={report.severity === 'medium' ? 'default' : 'outline'}
                                className="w-full justify-start"
                            >
                                <div className="h-2 w-2 rounded-full bg-amber-500 mr-2" />
                                Medium Priority
                            </Button>
                            <Button
                                onClick={() => handleUpdateSeverity('high')}
                                disabled={updating || report.severity === 'high'}
                                variant={report.severity === 'high' ? 'default' : 'outline'}
                                className="w-full justify-start"
                            >
                                <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
                                High Priority
                            </Button>
                        </div>
                    </div>

                    {/* Officer Assignment */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h3 className="font-semibold text-foreground mb-4">Assign to Officer</h3>
                        <div className="space-y-2">
                            <Button
                                onClick={() => {
                                    setShowAssignDialog(true);
                                    if (officers.length === 0) loadOfficers();
                                }}
                                variant="outline"
                                className="w-full justify-start"
                            >
                                <Send className="h-4 w-4 mr-2" />
                                Assign via WhatsApp
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowAssignDialog(true);
                                    if (officers.length === 0) loadOfficers();
                                }}
                                variant="outline"
                                className="w-full justify-start"
                            >
                                <Mail className="h-4 w-4 mr-2" />
                                Assign via Email
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h3 className="font-semibold text-foreground mb-4">Statistics</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Upvotes</span>
                                <span className="font-medium text-foreground">{report.upvotes || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Created</span>
                                <span className="font-medium text-foreground">
                                    {new Date(report.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Last Updated</span>
                                <span className="font-medium text-foreground">
                                    {new Date(report.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resolve Dialog */}
            {showResolveDialog && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <h2 className="text-xl font-bold text-foreground mb-2">Mark as Resolved</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Please upload a proof image to confirm the resolution of this issue.
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Proof Image (Required)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProofImageChange}
                                className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                        </div>

                        {proofImagePreview && (
                            <div className="mb-4">
                                <img
                                    src={proofImagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-lg border border-border"
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowResolveDialog(false);
                                    setProofImage(null);
                                    setProofImagePreview(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleResolveReport}
                                disabled={updating || !proofImage}
                            >
                                {updating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Resolving...
                                    </>
                                ) : (
                                    'Confirm Resolution'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Officer Assignment Dialog */}
            {showAssignDialog && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-foreground">Assign to Officer</h2>
                                <button
                                    onClick={() => {
                                        setShowAssignDialog(false);
                                        setSelectedOfficer(null);
                                    }}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                Select an admin to assign this report via WhatsApp
                            </p>
                        </div>

                        {/* Officers List */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {officers.length === 0 ? (
                                <div className="text-center py-12">
                                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No officers available</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Add phone numbers to admin accounts to enable assignments
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {officers.map((officer) => (
                                        <div
                                            key={officer.id}
                                            className={`rounded-lg border p-4 cursor-pointer transition-all ${selectedOfficer?.id === officer.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50'
                                                }`}
                                            onClick={() => setSelectedOfficer(officer)}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-foreground">
                                                        {officer.name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {officer.email}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {officer.department && (
                                                            <span className="text-xs px-2 py-1 bg-muted rounded-full">
                                                                🏢 {officer.department}
                                                            </span>
                                                        )}
                                                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                                                            {officer.role}
                                                        </span>
                                                        {officer.state && (
                                                            <span className="text-xs px-2 py-1 bg-muted rounded-full">
                                                                📍 {officer.state}
                                                                {officer.district && `, ${officer.district}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        📱 {officer.phone}
                                                    </p>
                                                </div>
                                                {selectedOfficer?.id === officer.id && (
                                                    <div className="shrink-0">
                                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border">
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleAssignOfficer}
                                        disabled={!selectedOfficer}
                                        className="flex-1"
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        Send via WhatsApp
                                    </Button>
                                    <Button
                                        onClick={handleAssignOfficerEmail}
                                        disabled={!selectedOfficer}
                                        className="flex-1"
                                        variant="secondary"
                                    >
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send via Email
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowAssignDialog(false);
                                        setSelectedOfficer(null);
                                    }}
                                    className="w-full"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

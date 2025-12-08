// Email service using Resend backend API

export interface EmailReportData {
    id: string;
    title: string;
    category: string;
    severity: string;
    description: string;
    location_name: string;
    latitude?: number;
    longitude?: number;
    image_url?: string;
    created_at: string;
}

export interface Officer {
    name: string;
    email: string;
    department?: string | null;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Send report assignment email via Resend backend
 */
export async function assignReportViaEmail(
    officer: Officer,
    report: EmailReportData,
    assignedBy: string
): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const googleMapsLink = report.latitude && report.longitude
            ? `https://www.google.com/maps?q=${report.latitude},${report.longitude}`
            : null;

        const response = await fetch(`${BACKEND_URL}/api/send-report-assignment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                officerEmail: officer.email,
                officerName: officer.name,
                reportId: report.id.substring(0, 8).toUpperCase(),
                title: report.title,
                category: report.category,
                severity: report.severity,
                description: report.description,
                locationName: report.location_name,
                googleMapsLink,
                imageUrl: report.image_url,
                reportedAt: new Date(report.created_at).toLocaleString(),
                assignedBy,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send email');
        }

        return {
            success: true,
            message: data.message,
        };
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email',
        };
    }
}

/**
 * Send custom email via backend
 */
export async function sendEmail(
    to: string,
    subject: string,
    html: string
): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to, subject, html }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to send email');
        }

        return {
            success: true,
            message: data.message,
        };
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email',
        };
    }
}

// Email service for officer assignments

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

/**
 * Generates email subject for report assignment
 */
export function generateEmailSubject(report: EmailReportData): string {
    return `[CivicLens] New Report Assignment: ${report.title} (${report.severity.toUpperCase()})`;
}

/**
 * Generates email body for report assignment
 */
export function generateEmailBody(report: EmailReportData): string {
    const googleMapsLink = report.latitude && report.longitude
        ? `https://www.google.com/maps?q=${report.latitude},${report.longitude}`
        : 'Location not available';

    const body = `Dear Officer,

You have been assigned a new civic report from CivicLens Admin Panel.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report ID: ${report.id.substring(0, 8).toUpperCase()}
Title: ${report.title}
Category: ${report.category}
Severity: ${report.severity.toUpperCase()}
Status: ASSIGNED
Reported On: ${new Date(report.created_at).toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOCATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Address: ${report.location_name}
Google Maps: ${googleMapsLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${report.description || 'No description provided'}

${report.image_url ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ATTACHED IMAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

View Image: ${report.image_url}
` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please review this report and take appropriate action at the earliest.

For urgent matters, please contact the admin panel immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated message from CivicLens Admin Panel.
Please do not reply directly to this email.

Best regards,
CivicLens Admin Team`;

    return body;
}

/**
 * Generates mailto: link for email client
 */
export function generateMailtoLink(email: string, subject: string, body: string): string {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);

    return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Opens email client with pre-filled report details
 */
export function openEmailClient(email: string, subject: string, body: string): void {
    const mailtoLink = generateMailtoLink(email, subject, body);
    window.location.href = mailtoLink;
}

/**
 * Assign report to officer via email
 */
export function assignReportViaEmail(officer: Officer, report: EmailReportData): void {
    const subject = generateEmailSubject(report);
    const body = generateEmailBody(report);
    openEmailClient(officer.email, subject, body);
}

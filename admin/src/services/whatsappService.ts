// WhatsApp messaging service for officer assignments

export interface Officer {
    id: string;
    name: string;
    phone: string;
    department: string;
    email?: string;
}

export interface WhatsAppReportData {
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

/**
 * Generates WhatsApp message for report assignment
 */
export function generateWhatsAppMessage(report: WhatsAppReportData): string {
    const googleMapsLink = report.latitude && report.longitude
        ? `https://www.google.com/maps?q=${report.latitude},${report.longitude}`
        : 'Location not available';

    const message = `
🚨 *New Civic Report Assigned*

*Report ID:* ${report.id.substring(0, 8)}
*Title:* ${report.title}
*Category:* ${report.category}
*Severity:* ${report.severity.toUpperCase()}
*Reported:* ${new Date(report.created_at).toLocaleString()}

📍 *Location:*
${report.location_name}
${googleMapsLink}

📝 *Description:*
${report.description || 'No description provided'}

${report.image_url ? `🖼 *Image:* Available in report\n` : ''}⚠️ *Please take immediate action.*

_This is an automated message from CivicLens Admin Panel._
`;

    return message.trim();
}

/**
 * Generates WhatsApp Click-to-Chat URL
 * @param phoneNumber - Format: country code + number (e.g., 919876543210)
 * @param message - Pre-filled message text
 */
export function generateWhatsAppLink(phoneNumber: string, message: string): string {
    // Remove all non-digit characters
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // WhatsApp Click-to-Chat API
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Opens WhatsApp with pre-filled message
 */
export function openWhatsApp(phoneNumber: string, message: string): void {
    const whatsappUrl = generateWhatsAppLink(phoneNumber, message);
    window.open(whatsappUrl, '_blank');
}

/**
 * Send report to officer via WhatsApp
 */
export function assignReportViaWhatsApp(officer: Officer, report: WhatsAppReportData): void {
    const message = generateWhatsAppMessage(report);
    openWhatsApp(officer.phone, message);
}

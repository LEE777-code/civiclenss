import {
    PDFDocument,
    StandardFonts,
    rgb
} from "pdf-lib";

// Helper for drawing section headers
const drawSectionTitle = (page: any, text: string, x: number, y: number, font: any) => {
    page.drawText(text, {
        x,
        y,
        size: 14,
        font,
        color: rgb(0, 0.45, 0.75),
    });
    page.drawLine({
        start: { x, y: y - 5 },
        end: { x: 550, y: y - 5 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
    });
};

interface ReportData {
    id: string;
    title: string;
    category: string;
    severity: string;
    status: string;
    description: string;
    location: string;
    image?: string;
    resolved_image_url?: string;
    date: string;
    createdAt: string;
}

export async function generateReportPDF(report: ReportData) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size points

    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Colors
    const primaryColor = rgb(0.1, 0.4, 0.7);
    const secondaryColor = rgb(0.3, 0.3, 0.3);
    const bgColor = rgb(0.96, 0.96, 0.98);

    // ------------------------------
    // 1. HEADER
    // ------------------------------
    page.drawRectangle({
        x: 0,
        y: height - 120,
        width,
        height: 120,
        color: bgColor,
    });

    page.drawText("CIVIC REPORT", {
        x: 50,
        y: height - 60,
        size: 28,
        font: fontBold,
        color: primaryColor,
    });

    page.drawText(`Status: ${report.status.toUpperCase()}`, {
        x: 50,
        y: height - 85,
        size: 14,
        font: fontBold,
        color: report.status.toLowerCase() === 'resolved' ? rgb(0, 0.6, 0.2) : secondaryColor,
    });

    page.drawText(`Report ID: #${report.id.substring(0, 8)}`, {
        x: width - 200,
        y: height - 60,
        size: 12,
        font,
        color: secondaryColor,
    });

    page.drawText(`Date: ${new Date(report.createdAt).toLocaleDateString()}`, {
        x: width - 200,
        y: height - 80,
        size: 12,
        font,
        color: secondaryColor,
    });

    // ------------------------------
    // 2. REPORT DETAILS
    // ------------------------------
    let yPos = height - 160;

    const drawLabelValue = (label: string, value: string, x: number) => {
        page.drawText(label, { x, y: yPos, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
        page.drawText(value, { x, y: yPos - 15, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
    };

    drawSectionTitle(page, "Issue Details", 50, yPos, fontBold);
    yPos -= 40;

    drawLabelValue("CATEGORY", report.category, 50);
    drawLabelValue("SEVERITY", report.severity, 250);
    drawLabelValue("SUBMITTED AT", new Date(report.createdAt).toLocaleString(), 400);

    yPos -= 50;

    drawLabelValue("LOCATION", report.location, 50);

    yPos -= 50;

    page.drawText("DESCRIPTION", { x: 50, y: yPos, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
    yPos -= 15;

    const desc = report.description || "No description provided";
    const wrappedLines = desc.match(/.{1,90}/g) || [];

    wrappedLines.forEach((line) => {
        page.drawText(line, { x: 50, y: yPos, size: 11, font, color: rgb(0.15, 0.15, 0.15) });
        yPos -= 16;
    });

    yPos -= 30;

    // ------------------------------
    // 3. EVIDENCE & PROOF
    // ------------------------------
    if (yPos < 300) { page.addPage([595.28, 841.89]); yPos = 800; } // New page if low

    drawSectionTitle(page, "Evidence & Resolution", 50, yPos, fontBold);
    yPos -= 40;

    const embedImage = async (imgData: string) => {
        try {
            if (!imgData) return null;
            if (imgData.startsWith('data:image')) {
                const base64Data = imgData.split(',')[1];
                const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                if (imgData.includes('image/png')) return await pdfDoc.embedPng(imageBytes);
                return await pdfDoc.embedJpg(imageBytes);
            }
            // If URL, we can't fetch client-side easily in PDF-lib without fetching first.
            // Assuming simplified client-side flow where 'image' passed is base64 for now as per app Logic.
            // If resolved_image_url is a Supabase URL, we might need to fetch it first in MyReports.
            // But for now, let's assume valid base64 or skipped.
            return null;
        } catch (e) {
            console.error("Image embed error", e);
            return null;
        }
    };

    // We need to fetch the resolved image if it's a URL (from Supabase public URL) before embedding?
    // Wait, MyReports passes 'resolved_image_url' which is likely a URL from the DB.
    // pdf-lib cannot embed from URL directly. We need to fetch it as ArrayBuffer.
    // But we are in an async function, so we can fetch!

    const fetchImageBytes = async (urlOrBase64: string) => {
        try {
            if (urlOrBase64.startsWith('data:image')) {
                const base64Data = urlOrBase64.split(',')[1];
                return Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            } else if (urlOrBase64.startsWith('http')) {
                const updatedUrl = urlOrBase64 + '?t=' + new Date().getTime(); // Cache bust
                const res = await fetch(updatedUrl);
                const arrayBuffer = await res.arrayBuffer();
                return new Uint8Array(arrayBuffer);
            }
            return null;
        } catch (e) { console.error("Fetch img error", e); return null; }
    };

    const imageBytes1 = report.image ? await fetchImageBytes(report.image) : null;
    const imageBytes2 = report.resolved_image_url ? await fetchImageBytes(report.resolved_image_url) : null;

    let img1 = null, img2 = null;
    if (imageBytes1) img1 = await pdfDoc.embedJpg(imageBytes1).catch(() => pdfDoc.embedPng(imageBytes1).catch(() => null));
    if (imageBytes2) img2 = await pdfDoc.embedJpg(imageBytes2).catch(() => pdfDoc.embedPng(imageBytes2).catch(() => null));

    // Draw Images Side by Side or Stacked
    const imgWidth = 230;
    const imgHeight = 180;

    if (img1) {
        page.drawImage(img1, { x: 50, y: yPos - imgHeight, width: imgWidth, height: imgHeight });
        page.drawText("Original Issue", { x: 50, y: yPos - imgHeight - 15, size: 10, font: fontOblique, color: secondaryColor });
    } else {
        page.drawRectangle({ x: 50, y: yPos - imgHeight, width: imgWidth, height: imgHeight, color: rgb(0.9, 0.9, 0.9) });
        page.drawText("No Image Available", { x: 100, y: yPos - (imgHeight / 2), size: 10, font, color: secondaryColor });
    }

    if (img2) {
        page.drawImage(img2, { x: 300, y: yPos - imgHeight, width: imgWidth, height: imgHeight });
        page.drawText("Resolution Proof", { x: 300, y: yPos - imgHeight - 15, size: 10, font: fontOblique, color: secondaryColor });
    } else if (report.status.toLowerCase() === 'resolved') {
        page.drawRectangle({ x: 300, y: yPos - imgHeight, width: imgWidth, height: imgHeight, color: rgb(0.9, 0.9, 0.9) });
        page.drawText("No Proof Image", { x: 350, y: yPos - (imgHeight / 2), size: 10, font, color: secondaryColor });
    }

    // ------------------------------
    // Footer
    // ------------------------------
    const pages = pdfDoc.getPages();
    pages.forEach((p, idx) => {
        const { width, height } = p.getSize();
        p.drawLine({ start: { x: 50, y: 40 }, end: { x: width - 50, y: 40 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
        p.drawText(`CivicLens Official Report - Generated on ${new Date().toLocaleString()}`, {
            x: 50, y: 25, size: 8, font, color: rgb(0.6, 0.6, 0.6)
        });
        p.drawText(`${idx + 1} / ${pages.length}`, { x: width - 70, y: 25, size: 8, font, color: rgb(0.6, 0.6, 0.6) });
    });

    return await pdfDoc.save();
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string) {
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

import {
    PDFDocument,
    StandardFonts,
    rgb
} from "pdf-lib";

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

// Helper for wrapping text
const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length <= maxWidth) {
            currentLine = testLine;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
};

export async function generateReportPDF(report: ReportData) {
    // Normalize fields so missing data does not break PDF generation
    const safeId = report.id || 'UNKNOWN';
    const safeTitle = report.title || 'No title provided';
    const safeStatus = report.status || 'Pending';
    const safeSeverity = report.severity || 'Medium';
    const safeCategory = report.category || 'General';
    const safeLocation = report.location || 'Unknown Location';
    const createdDate = report.createdAt ? new Date(report.createdAt) : new Date();

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4 size

    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Project Colors - matching index.css
    const primaryTeal = rgb(0.043, 0.58, 0.533); // hsl(174, 82%, 26%) 
    const darkText = rgb(0.1, 0.1, 0.1);
    const grayText = rgb(0.47, 0.5, 0.54);
    const lightBg = rgb(0.96, 0.96, 0.98);
    const successGreen = rgb(0.13, 0.69, 0.3); // hsl(142, 76%, 36%)
    const warningOrange = rgb(0.97, 0.59, 0.0); // hsl(38, 92%, 50%)
    const errorRed = rgb(0.87, 0.26, 0.26); // hsl(0, 84%, 60%)
    const borderGray = rgb(0.88, 0.88, 0.9);

    // ------------------------------
    // HEADER
    // ------------------------------
    page.drawRectangle({
        x: 0,
        y: height - 90,
        width,
        height: 90,
        color: lightBg,
    });

    page.drawText("CIVICLENS", {
        x: 50,
        y: height - 40,
        size: 24,
        font: fontBold,
        color: primaryTeal,
    });

    page.drawText("Civic Issue Report", {
        x: 50,
        y: height - 58,
        size: 10,
        font,
        color: grayText,
    });

    // Status Badge
    const statusText = safeStatus.toUpperCase();
    const statusColor = safeStatus.toLowerCase() === 'resolved' ? successGreen :
        safeStatus.toLowerCase() === 'rejected' ? errorRed : warningOrange;

    const badgeX = width - 140;
    const badgeY = height - 42;

    page.drawRectangle({
        x: badgeX,
        y: badgeY - 5,
        width: 90,
        height: 22,
        color: rgb(
            statusColor.red * 0.15 + 0.85,
            statusColor.green * 0.15 + 0.85,
            statusColor.blue * 0.15 + 0.85
        ),
        borderColor: statusColor,
        borderWidth: 1,
    });

    page.drawText(statusText, {
        x: badgeX + 8,
        y: badgeY + 2,
        size: 10,
        font: fontBold,
        color: statusColor,
    });

    // ID and date
    page.drawText(`ID: ${safeId.substring(0, 8)}`, {
        x: width - 140,
        y: height - 68,
        size: 8,
        font,
        color: grayText,
    });

    page.drawText(new Date().toLocaleDateString(), {
        x: width - 140,
        y: height - 80,
        size: 8,
        font,
        color: grayText,
    });

    // ------------------------------
    // DETAILS SECTION
    // ------------------------------
    let yPos = height - 120;

    page.drawText("ISSUE DETAILS", {
        x: 50,
        y: yPos,
        size: 12,
        font: fontBold,
        color: primaryTeal,
    });

    yPos -= 25;

    // Title - multi-line support
    const titleLines = wrapText(safeTitle, 70);
    const titleHeight = titleLines.length * 16;

    titleLines.forEach((line, index) => {
        page.drawText(line, {
            x: 55,
            y: yPos - (index * 16),
            size: 13,
            font: fontBold,
            color: darkText,
        });
    });

    yPos -= titleHeight + 15;

    // Info grid
    const drawInfoField = (label: string, value: string, x: number) => {
        page.drawText(label, {
            x,
            y: yPos,
            size: 7,
            font: fontBold,
            color: grayText,
        });

        const valueColor = label === "SEVERITY" ? (
            value === "High" ? errorRed :
                value === "Medium" ? warningOrange : successGreen
        ) : darkText;

        page.drawText(value, {
            x,
            y: yPos - 14,
            size: 10,
            font: label === "SEVERITY" ? fontBold : font,
            color: valueColor,
        });
    };

    drawInfoField("CATEGORY", safeCategory, 55);
    drawInfoField("SEVERITY", safeSeverity, 220);
    drawInfoField("DATE", createdDate.toLocaleDateString(), 380);

    yPos -= 35;

    // Location - multi-line support
    page.drawText("LOCATION", {
        x: 55,
        y: yPos,
        size: 7,
        font: fontBold,
        color: grayText,
    });

    const locationLines = wrapText(safeLocation, 80);
    locationLines.slice(0, 3).forEach((line, index) => {
        page.drawText(line, {
            x: 55,
            y: yPos - 14 - (index * 12),
            size: 9,
            font,
            color: darkText,
        });
    });

    yPos -= 14 + (locationLines.slice(0, 3).length * 12) + 25;

    // ------------------------------
    // DESCRIPTION
    // ------------------------------
    page.drawText("DESCRIPTION", {
        x: 50,
        y: yPos,
        size: 12,
        font: fontBold,
        color: primaryTeal,
    });

    yPos -= 20;

    const desc = report.description || "No description provided";
    const descLines = wrapText(desc, 85);

    // Show all description lines (dynamic)
    descLines.forEach((line, index) => {
        // Check if we need a new page
        if (yPos < 100) {
            page = pdfDoc.addPage([595.28, 841.89]);
            yPos = height - 50;
        }

        page.drawText(line, {
            x: 55,
            y: yPos,
            size: 9,
            font,
            color: darkText,
        });
        yPos -= 13;
    });

    yPos -= 25;

    // ------------------------------
    // IMAGES
    // ------------------------------
    if (yPos < 280) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPos = height - 50;
    }

    page.drawText("EVIDENCE", {
        x: 50,
        y: yPos,
        size: 12,
        font: fontBold,
        color: primaryTeal,
    });

    yPos -= 30;

    // Fetch images
    const fetchImageBytes = async (urlOrBase64: string) => {
        try {
            if (urlOrBase64.startsWith('data:image')) {
                const base64Data = urlOrBase64.split(',')[1];
                return Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            } else if (urlOrBase64.startsWith('http')) {
                const res = await fetch(urlOrBase64 + '?t=' + Date.now());
                return new Uint8Array(await res.arrayBuffer());
            }
            return null;
        } catch (e) {
            console.error("Image fetch error", e);
            return null;
        }
    };

    const imageBytes1 = report.image ? await fetchImageBytes(report.image) : null;
    const imageBytes2 = report.resolved_image_url ? await fetchImageBytes(report.resolved_image_url) : null;

    let img1 = null, img2 = null;
    if (imageBytes1) img1 = await pdfDoc.embedJpg(imageBytes1).catch(() => pdfDoc.embedPng(imageBytes1).catch(() => null));
    if (imageBytes2) img2 = await pdfDoc.embedJpg(imageBytes2).catch(() => pdfDoc.embedPng(imageBytes2).catch(() => null));

    const imgWidth = 220;
    const imgHeight = 170;

    // Original image
    page.drawText("Original Issue", {
        x: 55,
        y: yPos,
        size: 8,
        font: fontBold,
        color: grayText,
    });

    if (img1) {
        page.drawImage(img1, {
            x: 55,
            y: yPos - imgHeight - 15,
            width: imgWidth,
            height: imgHeight
        });
    } else {
        page.drawRectangle({
            x: 55,
            y: yPos - imgHeight - 15,
            width: imgWidth,
            height: imgHeight,
            color: rgb(0.93, 0.93, 0.93),
            borderColor: borderGray,
            borderWidth: 1,
        });
        page.drawText("No Image", {
            x: 120,
            y: yPos - (imgHeight / 2) - 10,
            size: 9,
            font,
            color: grayText,
        });
    }

    // Resolution image (if resolved)
    if (safeStatus.toLowerCase() === 'resolved' || img2) {
        const img2X = 295;

        page.drawText("Resolution Proof", {
            x: img2X,
            y: yPos,
            size: 8,
            font: fontBold,
            color: safeStatus.toLowerCase() === 'resolved' ? successGreen : grayText,
        });

        if (img2) {
            page.drawImage(img2, {
                x: img2X,
                y: yPos - imgHeight - 15,
                width: imgWidth,
                height: imgHeight
            });
        } else {
            page.drawRectangle({
                x: img2X,
                y: yPos - imgHeight - 15,
                width: imgWidth,
                height: imgHeight,
                color: rgb(0.93, 0.93, 0.93),
                borderColor: borderGray,
                borderWidth: 1,
            });
            page.drawText("Pending", {
                x: img2X + 75,
                y: yPos - (imgHeight / 2) - 10,
                size: 9,
                font,
                color: grayText,
            });
        }
    }

    // ------------------------------
    // FOOTER
    // ------------------------------
    const pages = pdfDoc.getPages();
    pages.forEach((p, idx) => {
        const { width } = p.getSize();

        p.drawRectangle({
            x: 0,
            y: 0,
            width,
            height: 45,
            color: lightBg,
        });

        p.drawText("CIVICLENS", {
            x: 50,
            y: 22,
            size: 9,
            font: fontBold,
            color: primaryTeal,
        });

        p.drawText("Official Report", {
            x: 50,
            y: 12,
            size: 7,
            font,
            color: grayText,
        });

        p.drawText(`Generated: ${new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`, {
            x: 200,
            y: 17,
            size: 7,
            font,
            color: grayText,
        });

        p.drawText(`Page ${idx + 1} of ${pages.length}`, {
            x: width - 80,
            y: 17,
            size: 8,
            font,
            color: grayText,
        });
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

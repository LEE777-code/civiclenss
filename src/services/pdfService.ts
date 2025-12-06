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
    date: string;
    createdAt: string;
}

export async function generateReportPDF(report: ReportData) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);

    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // ------------------------------
    // 1. HEADER BANNER
    // ------------------------------
    page.drawRectangle({
        x: 0,
        y: height - 100,
        width,
        height: 100,
        color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText("CIVIC REPORT SUMMARY", {
        x: 40,
        y: height - 55,
        size: 24,
        font: fontBold,
        color: rgb(0, 0.45, 0.75),
    });

    // Logo placeholder
    page.drawRectangle({
        x: width - 120,
        y: height - 90,
        width: 80,
        height: 60,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.75, 0.75, 0.75),
        borderWidth: 1,
    });
    page.drawText("LOGO", {
        x: width - 95,
        y: height - 60,
        size: 12,
        font,
        color: rgb(0.6, 0.6, 0.6),
    });

    // ------------------------------
    // 2. BASIC INFO SECTION
    // ------------------------------
    drawSectionTitle(page, "Report Information", 40, height - 130, fontBold);

    let yPos = height - 160;

    const writeLine = (label: string, value: string) => {
        page.drawText(`${label}:`, {
            x: 40,
            y: yPos,
            size: 12,
            font: fontBold,
            color: rgb(0.2, 0.2, 0.2),
        });
        page.drawText(value || "N/A", {
            x: 180,
            y: yPos,
            size: 12,
            font,
            color: rgb(0.1, 0.1, 0.1),
        });
        yPos -= 22;
    };

    writeLine("Report ID", report.id.substring(0, 8));
    writeLine("Category", report.category);
    writeLine("Severity", report.severity);
    writeLine("Status", report.status);
    writeLine("Submitted At", new Date(report.createdAt).toLocaleString());

    // ------------------------------
    // 3. LOCATION SECTION
    // ------------------------------
    drawSectionTitle(page, "Location", 40, yPos - 10, fontBold);
    yPos -= 40;

    writeLine("Address", report.location);

    // ------------------------------
    // 4. DESCRIPTION SECTION
    // ------------------------------
    drawSectionTitle(page, "Description", 40, yPos - 10, fontBold);
    yPos -= 40;

    const desc = report.description || "No description provided";
    const wrappedLines = desc.match(/.{1,75}/g) || [];

    wrappedLines.forEach((line) => {
        page.drawText(line, {
            x: 40,
            y: yPos,
            size: 12,
            font,
            color: rgb(0.15, 0.15, 0.15),
        });
        yPos -= 18;
        if (yPos < 200) return; // Stop if running out of space
    });

    yPos -= 20;

    // ------------------------------
    // 5. IMAGE SECTION
    // ------------------------------
    if (report.image && yPos > 250) {
        drawSectionTitle(page, "Attached Image", 40, yPos - 10, fontBold);
        yPos -= 40;

        try {
            // For base64 images
            if (report.image.startsWith('data:image')) {
                const base64Data = report.image.split(',')[1];
                const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                let img;
                if (report.image.includes('image/png')) {
                    img = await pdfDoc.embedPng(imageBytes);
                } else {
                    img = await pdfDoc.embedJpg(imageBytes);
                }

                const dims = img.scale(0.25);
                const maxWidth = 200;
                const maxHeight = 150;

                let finalWidth = dims.width;
                let finalHeight = dims.height;

                if (finalWidth > maxWidth) {
                    const ratio = maxWidth / finalWidth;
                    finalWidth = maxWidth;
                    finalHeight = finalHeight * ratio;
                }

                if (finalHeight > maxHeight) {
                    const ratio = maxHeight / finalHeight;
                    finalHeight = maxHeight;
                    finalWidth = finalWidth * ratio;
                }

                page.drawRectangle({
                    x: 40,
                    y: yPos - finalHeight - 5,
                    width: finalWidth + 10,
                    height: finalHeight + 10,
                    color: rgb(1, 1, 1),
                    borderWidth: 1,
                    borderColor: rgb(0.7, 0.7, 0.7),
                });

                page.drawImage(img, {
                    x: 45,
                    y: yPos - finalHeight,
                    width: finalWidth,
                    height: finalHeight,
                });

                yPos -= (finalHeight + 20);
            }
        } catch (error) {
            console.error('Error embedding image:', error);
            page.drawText("Error loading image", {
                x: 40,
                y: yPos,
                size: 10,
                font,
                color: rgb(0.5, 0, 0),
            });
        }
    }

    // ------------------------------
    // 6. FOOTER
    // ------------------------------
    page.drawLine({
        start: { x: 40, y: 40 },
        end: { x: width - 40, y: 40 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText(`Generated on: ${new Date().toLocaleString()}`, {
        x: 40,
        y: 20,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText("Page 1 of 1", {
        x: width - 90,
        y: 20,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4),
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

import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  console.log(`[DOWNLOAD] Requested ID: ${id}`);

  try {
    const form = await prisma.formData.findUnique({
      where: { id },
      select: { studentJson: true, subjectsJson: true },
    });

    if (!form) {
      console.log(`[DOWNLOAD] Record not found: ${id}`);
      return NextResponse.json({ error: "Marksheet not found" }, { status: 404 });
    }

    const student = form.studentJson as any;
    const subjects = form.subjectsJson as any[];

    console.log(`[DOWNLOAD] Generating PDF for: ${student?.name || "N/A"}`);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 780;

    page.drawText("OFFICE OF THE CONTROLLER OF EXAMINATIONS", {
      x: 110,
      y,
      size: 14,
      font: bold,
    });
    y -= 35;

    page.drawText("Mark-Sheet", {
      x: 235,
      y,
      size: 20,
      font: bold,
      color: rgb(0, 0.2, 0.6),
    });
    y -= 55;

    // Student info
    page.drawText(`Marks Secured by: ${student?.name?.toUpperCase() || "N/A"}`, {
      x: 60,
      y,
      size: 11,
      font: helvetica,
    });
    y -= 20;

    page.drawText(`Symbol No.: ${student?.symbolNumber || "N/A"}`, { x: 60, y, size: 11, font: helvetica });
    page.drawText(`Registration No.: ${student?.registrationNumber || "N/A"}`, { x: 320, y, size: 11, font: helvetica });
    y -= 22;

    page.drawText(`School: ${student?.school || "N/A"}`, { x: 60, y, size: 11, font: helvetica });
    page.drawText(`Grade: ${student?.grade || "11"}`, { x: 380, y, size: 11, font: helvetica });
    y -= 45;

    // Table (REMARKS column removed)
    if (subjects?.length > 0) {
      // Only 8 columns now (removed Remarks)
      const colWidths = [140, 55, 55, 55, 55, 60, 60, 75]; // Adjusted widths to fill space
      const tableLeft = 45;
      let tx = tableLeft;

      // Headers (no Remarks)
      const headers = ["SUBJECTS", "FULL MARKS", "", "PASS MARKS", "", "MARKS OBTAINED", "", "TOTAL"];
      const subHeaders = ["", "TH", "PR", "TH", "PR", "TH", "PR", ""];

      // Main headers
      headers.forEach((h, i) => {
        if (h) page.drawText(h, { x: tx + 10, y, size: 11, font: bold });
        tx += colWidths[i];
      });
      y -= 20;

      // Sub headers
      tx = tableLeft;
      subHeaders.forEach((s, i) => {
        if (s) page.drawText(s, { x: tx + 20, y, size: 10, font: bold });
        tx += colWidths[i];
      });
      y -= 22;

      let grandFull = 0;
      let grandObt = 0;

      subjects.forEach((sub: any) => {
        if (y < 120) return;

        tx = tableLeft;

        const thF = Number(sub.theoryFull) || 0;
        const prF = Number(sub.practicalFull) || 0;
        const thP = Number(sub.theoryPass) || 0;
        const prP = Number(sub.practicalPass) || 0;
        const thO = Number(sub.theoryObtained) || 0;
        const prO = Number(sub.practicalObtained) || 0;

        const totF = thF + prF;
        const totO = thO + prO;

        grandFull += totF;
        grandObt += totO;

        // No remarks anymore — just show total
        const cells = [
          (sub.subjectName || "—").toUpperCase(),
          thF || "-",
          prF || "-",
          thP || "-",
          prP || "-",
          thO || "-",
          prO || "-",
          totO,
        ];

        cells.forEach((cell, i) => {
          let padx = 10;
          if (i === 0) padx = 10; // subject left-aligned
          else padx = Math.max(5, (colWidths[i] - String(cell).length * 6.2) / 2); // center numbers

          page.drawText(String(cell), {
            x: tx + padx,
            y,
            size: 10,
            font: i === 0 ? bold : helvetica,
            color: rgb(0, 0, 0),
          });
          tx += colWidths[i];
        });

        y -= 24;
      });

      y -= 40;

      const perc = grandFull > 0 ? ((grandObt / grandFull) * 100).toFixed(2) : "0.00";
      const result = grandObt >= 35 ? "PASS" : "FAIL";

      page.drawText(`GRAND TOTAL : ${grandObt} / ${grandFull}`, { x: 70, y, size: 12, font: bold });
      page.drawText(`Percentage : ${perc}%`, { x: 280, y, size: 12, font: bold });
      page.drawText(`RESULT : ${result}`, {
        x: 440,
        y,
        size: 13,
        font: bold,
        color: result === "PASS" ? rgb(0, 0.6, 0) : rgb(0.9, 0, 0),
      });
    }

    y -= 80;

    if (y > 100) {
      page.drawLine({ start: { x: 80, y }, end: { x: 240, y }, thickness: 1 });
      page.drawLine({ start: { x: 340, y }, end: { x: 500, y }, thickness: 1 });
      page.drawText("Checked by", { x: 110, y: y - 15, size: 10, font: helvetica });
      page.drawText("Controller of Examinations", { x: 360, y: y - 15, size: 10, font: helvetica });
    }

    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes); // <-- de.js Buffer


   return new NextResponse(buffer, { 
  status: 200,
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${(student?.name || "marksheet").replace(/\s+/g, "_")}.pdf"`,
  },
});

  } catch (err: any) {
    console.error("[DOWNLOAD ERROR]", err.message, err.stack);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: err.message },
      { status: 500 }
    );
  }
}
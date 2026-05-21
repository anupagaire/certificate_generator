import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function POST(req: NextRequest) {
  try {
    const { student, subjects = [] } = await req.json();

    if (!student?.name?.trim()) {
      return NextResponse.json(
        { error: "Student name is required" },
        { status: 400 }
      );
    }

    // CREATE PDF (same as /api/form but NO RC Vault signing)

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 780;

    // Header
    page.drawText("OFFICE OF THE CONTROLLER OF EXAMINATIONS", {
      x: 110,
      y,
      size: 14,
      font: bold,
    });

    y -= 35;

    page.drawText("Mark-Sheet", {
      x: 230,
      y,
      size: 20,
      font: bold,
      color: rgb(0, 0.2, 0.6),
    });

    y -= 50;

    // Student Info
    page.drawText(`Name: ${student.name}`, { x: 60, y, size: 11, font: helvetica });
    y -= 20;

    page.drawText(`Symbol No.: ${student.symbolNumber || "N/A"}`, {
      x: 60,
      y,
      size: 11,
      font: helvetica,
    });

    page.drawText(`Registration No.: ${student.registrationNumber || "N/A"}`, {
      x: 320,
      y,
      size: 11,
      font: helvetica,
    });

    y -= 40;

    // TABLE
    const colWidths = [140, 48, 48, 48, 48, 52, 52, 62];
    const tableLeft = 45;
    let tx = tableLeft;

    const headers = ["SUBJECTS", "FULL MARKS", "", "PASS MARKS", "", "MARKS OBTAINED", "", "TOTAL"];
    const subHeaders = ["", "TH", "PR", "TH", "PR", "TH", "PR", ""];

    headers.forEach((h, i) => {
      if (h) page.drawText(h, { x: tx + 8, y, size: 10, font: bold });
      tx += colWidths[i];
    });

    y -= 18;
    tx = tableLeft;

    subHeaders.forEach((s, i) => {
      if (s) page.drawText(s, { x: tx + 18, y, size: 9, font: bold });
      tx += colWidths[i];
    });

    y -= 22;

    let grandFull = 0;
    let grandObt = 0;

    subjects.forEach((sub: any) => {
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

      const cells = [
        (sub.subjectName || "-").toUpperCase(),
        thF || "-",
        prF || "-",
        thP || "-",
        prP || "-",
        thO || "-",
        prO || "-",
        totO,
      ];

      cells.forEach((cell, i) => {
        page.drawText(String(cell), {
          x: tx + 10,
          y,
          size: 9,
          font: i === 0 || i === 7 ? bold : helvetica,
        });
        tx += colWidths[i];
      });

      y -= 20;
    });

    // GRAND TOTAL
    y -= 30;

    const percentage = grandFull > 0 ? ((grandObt / grandFull) * 100).toFixed(2) : "0.00";
    const result = Number(percentage) >= 35 ? "PASS" : "FAIL";

    page.drawText(`GRAND TOTAL: ${grandObt} / ${grandFull}`, { x: 60, y, size: 12, font: bold });
    y -= 20;

    page.drawText(`Percentage: ${percentage}%`, { x: 60, y, size: 11, font: bold });
    y -= 20;

    page.drawText(`Result: ${result}`, {
      x: 60,
      y,
      size: 12,
      font: bold,
      color: result === "PASS" ? rgb(0, 0.6, 0) : rgb(0.9, 0, 0),
    });

    // SIGNATURE LINES
    y -= 80;

    page.drawLine({ start: { x: 80, y }, end: { x: 240, y }, thickness: 1 });
    page.drawLine({ start: { x: 340, y }, end: { x: 500, y }, thickness: 1 });

    page.drawText("Checked by", { x: 120, y: y - 15, size: 10, font: helvetica });
    page.drawText("Controller of Examinations", { x: 360, y: y - 15, size: 10, font: helvetica });

    // Return raw unsigned PDF
const pdfBytes = await pdfDoc.save();

return new NextResponse(pdfBytes.buffer as ArrayBuffer, {
  status: 200,
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${student.name.replace(/\s+/g, "_")}_marksheet.pdf"`,
  },
});

  } catch (err: any) {
    console.error("ERROR:", err);
    return NextResponse.json({ error: err.message || "PDF generation failed" }, { status: 500 });
  }
}
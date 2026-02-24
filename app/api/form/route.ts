// app/api/sign-marksheet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

const RCVAULT_BASE = "http://202.51.70.18/api/v1";
const TOKEN = process.env.RCVAULT_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const { student, subjects = [] } = await req.json();

    if (!student?.name?.trim()) {
      return NextResponse.json(
        { error: "Student name is required" },
        { status: 400 }
      );
    }

    // =========================
    // 1️⃣ CREATE PDF
    // =========================

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

    // =========================
    // 2️⃣ TABLE DESIGN
    // =========================

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

    // =========================
    // 3️⃣ GRAND TOTAL SECTION
    // =========================

    y -= 30;

    const percentage = grandFull > 0 ? ((grandObt / grandFull) * 100).toFixed(2) : "0.00";
    const result = Number(percentage) >= 35 ? "PASS" : "FAIL";

    page.drawText(`GRAND TOTAL: ${grandObt} / ${grandFull}`, { x: 60, y, size: 12, font: bold });
    y -= 20;

    page.drawText(`Percentage: ${percentage}%`, { x: 60, y, size: 11, font: bold });
    y -= 20;

    page.drawText(`Result: ${result}`, { x: 60, y, size: 12, font: bold, color: result === "PASS" ? rgb(0, 0.6, 0) : rgb(0.9, 0, 0) });

    // =========================
    // 4️⃣ SIGNATURE LINES
    // =========================

    y -= 80;

    // Signature lines
    page.drawLine({ start: { x: 80, y }, end: { x: 240, y }, thickness: 1 });
    page.drawLine({ start: { x: 340, y }, end: { x: 500, y }, thickness: 1 });

    page.drawText("Checked by", { x: 120, y: y - 15, size: 10, font: helvetica });
    page.drawText("Controller of Examinations", { x: 360, y: y - 15, size: 10, font: helvetica });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // =========================
    // 5️⃣ RCVAULT SIGNING
    // =========================

    const sessionRes = await fetch(`${RCVAULT_BASE}/signing-challenge/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        force_create: true,
        requested_max_content: 10000,
      }),
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.text();
      throw new Error("RCVAULT session error: " + err);
    }

    const sessionData = await sessionRes.json();
    const sessionId = sessionData.signing_session_id;
    if (!sessionId) throw new Error("No signing session returned from RCVault");

    // Read signature image
    const signaturePath = path.join(process.cwd(), "public", "aa.png");
    if (!fs.existsSync(signaturePath)) throw new Error("Signature image not found: " + signaturePath);
    const signatureImage = fs.readFileSync(signaturePath);

    // Signature box coordinates (below GRAND TOTAL)
    const sigX1 = 80;
    const sigY1 = y + 10;
    const sigX2 = 240;
    const sigY2 = y + 50;

    const form = new FormData();
    form.append("signing_session_id", sessionId);
    form.append(
      "pdf_files",
      new Blob([pdfBuffer], { type: "application/pdf" }),
      `${student.name}_marksheet.pdf`
    );
    form.append("signature_box", `${sigX1},${sigY1},${sigX2},${sigY2}`);
    form.append("signature_page", "1");
    form.append("location", "Nepal");
    form.append("apply_stamp", "true");
    form.append("signature_stamp", new Blob([signatureImage], { type: "image/png" }), "aa.png");


    const signRes = await fetch(`${RCVAULT_BASE}/sign/pdf`, {
      method: "POST",
      headers: { Authorization: `Token ${TOKEN}` },
      body: form,
    });

    if (!signRes.ok) {
      const text = await signRes.text();
      throw new Error("RCVAULT signing error: " + text);
    }

    const signData = await signRes.json();

    if (!signData?.results?.length || !signData.results[0]?.signature) {
      throw new Error("RCVAULT signing returned no signature. Full response: " + JSON.stringify(signData));
    }

    const base64Pdf = signData.results[0].signature;
    const signedPdfBuffer = Buffer.from(base64Pdf, "base64");

    return new NextResponse(signedPdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${student.name.replace(/\s+/g, "_")}_SIGNED.pdf"`,
      },
    });

  } catch (err: any) {
    console.error("ERROR:", err);
    return NextResponse.json({ error: err.message || "Signing failed" }, { status: 500 });
  }
}

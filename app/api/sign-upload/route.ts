import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const RCVAULT_BASE = "http://202.51.70.18/api/v1";
const TOKEN = process.env.RCVAULT_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const uploadedFile = formData.get("pdf") as File;

    if (!uploadedFile) {
      return NextResponse.json(
        { error: "PDF file is required" },
        { status: 400 }
      );
    }

    // Convert uploaded file to buffer
    const pdfArrayBuffer = await uploadedFile.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    // 1️⃣ CREATE SIGNING SESSION
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

    if (!sessionId) {
      throw new Error("No signing session returned");
    }

    // 2️⃣ READ SIGNATURE IMAGE
    const signaturePath = path.join(process.cwd(), "public", "aa.png");

    if (!fs.existsSync(signaturePath)) {
      throw new Error("Signature image not found in public folder");
    }

    const signatureImage = fs.readFileSync(signaturePath);

    const sigX1 = 80;
    const sigY1 = 100;
    const sigX2 = 240;
    const sigY2 = 150;

    // 4️⃣ PREPARE FORM DATA FOR RCVAULT
    const rcForm = new FormData();

    rcForm.append("signing_session_id", sessionId);

    rcForm.append(
      "pdf_files",
      new Blob([pdfBuffer], { type: "application/pdf" }),
      uploadedFile.name
    );

    rcForm.append("signature_box", `${sigX1},${sigY1},${sigX2},${sigY2}`);
    rcForm.append("signature_page", "1");
    rcForm.append("location", "Nepal");
    rcForm.append("apply_stamp", "true");

    rcForm.append(
      "signature_stamp",
      new Blob([signatureImage], { type: "image/png" }),
      "aa.png"
    );

    // 5️⃣ SIGN PDF
    const signRes = await fetch(`${RCVAULT_BASE}/sign/pdf`, {
      method: "POST",
      headers: {
        Authorization: `Token ${TOKEN}`,
      },
      body: rcForm,
    });

    if (!signRes.ok) {
      const text = await signRes.text();
      throw new Error("RCVAULT signing error: " + text);
    }

    const signData = await signRes.json();

    if (!signData?.results?.length) {
      throw new Error("No signed PDF returned");
    }

    const base64Pdf = signData.results[0].signature;
    const signedPdfBuffer = Buffer.from(base64Pdf, "base64");

    return new NextResponse(signedPdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="SIGNED_${uploadedFile.name}"`,
      },
    });

  } catch (err: any) {
    console.error("SIGN-UPLOAD ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Signing failed" },
      { status: 500 }
    );
  }
}

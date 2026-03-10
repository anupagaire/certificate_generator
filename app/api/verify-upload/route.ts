import { NextRequest, NextResponse } from "next/server";

const RCVAULT_BASE = "http://202.51.70.18/api/v1";
const TOKEN = process.env.RCVAULT_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const uploadedFile = formData.get("pdf_data") as File;

    if (!uploadedFile) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    // Convert Web File → Blob
    const fileBlob = new Blob([await uploadedFile.arrayBuffer()], {
      type: "application/pdf",
    });

    // Use Web FormData to send to RCVault
    const rcForm = new FormData();
    rcForm.append("pdf_data", fileBlob, "signed.pdf");

    const verifyRes = await fetch(`${RCVAULT_BASE}/verify/pdf/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${TOKEN}`,
      },
      body: rcForm as any,
    });

    if (!verifyRes.ok) {
      const text = await verifyRes.text();
      throw new Error("Verification failed: " + text);
    }

    const verifyData = await verifyRes.json();

    return NextResponse.json({ success: true, data: verifyData });
  } catch (err: any) {
    console.error("VERIFY ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Verification failed" },
      { status: 500 }
    );
  }
}

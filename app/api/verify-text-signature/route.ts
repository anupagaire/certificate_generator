import { NextRequest, NextResponse } from "next/server";
import FormData from "form-data";
import fetch from "node-fetch"; 
import { prisma } from "@/lib/prisma";

const RCVAULT_BASE = "http://202.51.70.18/api/v1";
const TOKEN = process.env.RCVAULT_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const { formId, textToVerify } = await req.json();

    if (!formId) {
      return NextResponse.json({ error: "formId is required" }, { status: 400 });
    }

    // Fetch form from DB
    const form = await prisma.signedForm.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Use edited text if provided, else DB text
    const text = textToVerify ?? form.formattedText;

    // Prepare multipart/form-data
    const formData = new FormData();
    formData.append("text", text);
    formData.append("signed_text", form.signature);

    // Send to RCVAULT verify endpoint
    const verifyRes = await fetch(`${RCVAULT_BASE}/verify/text`, {
      method: "POST",
      headers: {
        Authorization: `Token ${TOKEN}`,
        ...formData.getHeaders(),
      },
      body: formData as any,
    });

    let isValid = false;
    try {
      const data = await verifyRes.json();
      isValid = true; // if no error, signature is valid
    } catch {
      const text = await verifyRes.text();
      console.error("RCVAULT response is not JSON:", text);
      isValid = false;
    }

    return NextResponse.json({ is_valid: isValid });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
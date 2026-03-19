import { NextRequest, NextResponse } from "next/server";

const RCVAULT_BASE = "http://202.51.70.18/api/v1";
const TOKEN = process.env.RCVAULT_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const { text, signed_text } = await req.json();

    const formData = new FormData();
    formData.append("text", text);
    formData.append("signed_text", signed_text);

    const verifyRes = await fetch(`${RCVAULT_BASE}/verify/text/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${TOKEN}`,
      },
      body: formData,
    });

    const verifyData = await verifyRes.json();

    return NextResponse.json(verifyData);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
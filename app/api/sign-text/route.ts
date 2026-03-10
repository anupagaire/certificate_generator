import { NextRequest, NextResponse } from "next/server";
const RCVAULT_BASE="http://202.51.70.18/api/v1"
const TOKEN = process.env.RCVAULT_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    //   const formattedText = `{${Object.entries(data)
    //     .map(([k,v]) =>`'${k}'='${JSON.stringify(v)}'`)
    //     .join("|")}}`;


  function flattenData(data: any, prefix = ""): string[] {
    return Object.entries(data).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (Array.isArray(value)) {
        // Flatten array elements with index
        return value.flatMap((v, i) => flattenData(v, `${fullKey}.${i}`));
      } else if (typeof value === "object" && value !== null) {
        return flattenData(value, fullKey);
      } else {
        return [`'${fullKey}'='${value}'`];
      }
    });
  }

const formattedText = `{${flattenData(data).join("|")}}`;
// {'name'='test'|'class'='8'}, {'test8'}

    // Create signing session
    const sessionRes = await fetch(`${RCVAULT_BASE}/signing-challenge/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        force_create: true,
        requested_max_content: 1000,
      }),
    });

    const sessionData = await sessionRes.json();
    const sessionId = sessionData.signing_session_id;

    // Sign text
    const signRes = await fetch(`${RCVAULT_BASE}/sign/text`, {
      method: "POST",
      headers: {
        Authorization: `Token ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signing_session_id: sessionId,
        text: [formattedText],
      }),
    });

    const signData = await signRes.json();

    return NextResponse.json({
      formattedText,
      signature: signData.results[0].signature,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
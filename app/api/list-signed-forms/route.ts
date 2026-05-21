import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { student, subjects, formattedText, signature, provider } = await req.json();

    await prisma.signedForm.create({
      data: {
        studentName: student.name,
        formattedText,
        signature,
        provider: provider ?? "rcvault", // default to rcvault for backward compat
      },
    });

    const allForms = await prisma.signedForm.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ allForms });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allForms = await prisma.signedForm.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ allForms });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
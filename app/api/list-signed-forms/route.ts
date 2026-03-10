import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { student, subjects, formattedText, signature } = await req.json();

    // Save to MongoDB
    await prisma.signedForm.create({
      data: {
        studentName: student.name,
        formattedText,
        signature,
      },
    });

    // Return updated list of all forms
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
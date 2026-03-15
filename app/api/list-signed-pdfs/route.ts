import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const pdfs = await prisma.signedPdf.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ pdfs });
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/attributes?categorySlug=perruques
// Returns the attribute templates for a given category, ordered by position.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("categorySlug");
  if (!slug) {
    return NextResponse.json({ error: "categorySlug requis." }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!category) {
    return NextResponse.json({ templates: [] });
  }

  const templates = await prisma.attributeTemplate.findMany({
    where: { categoryId: category.id },
    orderBy: { position: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      unit: true,
      options: true,
      isRequired: true,
      position: true,
    },
  });

  return NextResponse.json({ templates });
}

import { NextRequest, NextResponse } from "next/server";
import { listProducts } from "@/lib/data/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SORTS = [
  "popularite",
  "nouveautes",
  "prix-asc",
  "prix-desc",
  "note",
] as const;

// GET /api/products?categorie=perruques&tri=prix-asc&q=majeste
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorie = searchParams.get("categorie") ?? undefined;
  const triRaw = searchParams.get("tri") ?? undefined;
  const tri = (VALID_SORTS as readonly string[]).includes(triRaw ?? "")
    ? (triRaw as (typeof VALID_SORTS)[number])
    : undefined;
  const query = searchParams.get("q")?.trim() || undefined;

  try {
    const products = await listProducts({
      categorySlug: categorie,
      sort: tri,
      query,
    });
    return NextResponse.json({ products, count: products.length });
  } catch (err) {
    console.error("[/api/products] error", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des produits." },
      { status: 500 },
    );
  }
}

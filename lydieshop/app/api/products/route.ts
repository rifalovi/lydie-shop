import { NextRequest, NextResponse } from "next/server";
import { products } from "@/lib/products";

// GET /api/products?categorie=perruques&tri=prix-asc
// En production, remplacer par une requête Prisma paginée.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categorie = searchParams.get("categorie");
  const tri = searchParams.get("tri");

  let result = [...products];
  if (categorie) {
    result = result.filter((p) => p.categorySlug === categorie);
  }

  switch (tri) {
    case "prix-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "prix-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "note":
      result.sort((a, b) => b.rating - a.rating);
      break;
    case "nouveautes":
      result.sort((a, b) => Number(b.isNew ?? 0) - Number(a.isNew ?? 0));
      break;
    default:
      result.sort((a, b) => b.reviewCount - a.reviewCount);
  }

  return NextResponse.json({ products: result, count: result.length });
}
